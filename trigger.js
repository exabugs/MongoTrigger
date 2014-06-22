// MongoDB Extention
//  * Embeddeds Pattern
//  * Ancestors Pattern

var metadata = 'metadata';
var metadata_embeddeds = 'embeddeds'; // metadata.embeddeds
var metadata_ancestors = 'ancestors'; // metadata.ancestors

var stop_collection = 'test.stop'; // database:test collection:stop

//////////////////////////////////////////////////////

function do_ancestors( op, tag, infos ) {
	if ( !infos ) return;
//printjson(op);
	for ( var i = 0; i < infos.length; i++ ) {
		var info = infos[i];
		if ( info.collection != tag[1] ) continue;
		update_ancestors( tag[0], op, info );
	}       
}	       

function update_ancestors( db, op, info ) {
	var field = info.parent; 
	var o = op.o['$set'] || op.o;
	if ( !o[field] ) return;

	var conn = connect( db );
	var collection = conn[ info.collection ];
	var select = {};
	select[ info.ancestors ] = 1;
printjson( {_id: o[field]} );
printjson( {select: select} );

	var _id = op.o2 ? op.o2._id : o._id;

	var parent = collection.findOne( { _id: o[field] }, select );
	if ( !parent ) return;
	var parent_ancestors = parent[ info.ancestors ];
printjson( {parent_ancestors: parent_ancestors} );

	var myself = collection.findOne( { _id: _id }, select );
	if ( !myself ) return;
	var myself_ancestors = myself[ info.ancestors ];
printjson( {myself_ancestors: myself_ancestors} );
	var length = myself_ancestors.length - 1;

	var condition = {}; 
	condition[ info.ancestors ] = { $in: [ _id ] };
printjson( {condition: condition} );

	var targets = collection.find( condition, select ).toArray();
	for ( var i = 0; i < targets.length; i++ ) {
		var t = targets[i];
printjson(t);
		var ancestors = t.ancestors || [];
		ancestors = parent_ancestors.concat( ancestors.slice( length ) );
printjson( {NewAncestors : ancestors} );
		
		collection.update( { _id: t._id }, { $set: { ancestors: ancestors} } );
	}

}

//////////////////////////////////////////////////////

function do_embeddeds( op, tag, infos ) {
	if ( !infos ) return;
	if ( op.o2 === undefined ) return;
	for ( var i = 0; i < infos.length; i++ ) {
		var info = infos[i];
		if ( info.master.collection != tag[1] ) continue;
		var master = get_master( op.o, info );
		if ( !master ) continue;
		var referrer = get_referrer( op.o2, info );
		if ( !referrer ) continue;
		var conn = connect( tag[0] );
		conn[ info.referrer.collection ].update( referrer, { $set: master }, { multi: true } );
	}
}

function get_master( data, info ) {
	var obj = {};
	var fields = info.master.fields;
	var referrer_field = info.referrer.multi ? [info.referrer.field, '$'].join('.') : info.referrer.field;
	var update = false;
	for ( var i = 0; i < fields.length; i++ ) {
		var field = fields[i];
		var o = data['$set'] || data;
		if ( !o[field] ) continue;
		obj[ [referrer_field, field].join('.') ] = o[field];
		update = true;
	}
	return update ? obj : null;
}

function get_referrer( data, info ) {
	if ( !data._id ) return null;
	var obj = {};
	obj[ [info.referrer.field, '_id'].join('.') ] = data._id;
	return obj;
}


var option = DBQuery.Option.awaitData | DBQuery.Option.tailable;
var cursor = connect( 'local' ).oplog.rs.find().addOption( option );
cursor.skip( cursor.count() );

print( 'Ready' );

var infos = {};
var stop = false;
while ( !stop ) {
	var now = new Date();
//printjson( now );

	while ( cursor.hasNext() ) {
		var op = cursor.next();
//printjson( op );
		if ( op.ns === stop_collection ) {
			stop = true;
			break;
		}

		var tag = op.ns.split('.');
		infos[ tag[0] ] = infos[ tag[0] ] || {};
		if ( tag[1] === metadata && tag[2] ) {
			var conn = connect( tag[0] );
			var collection = op.ns.slice( op.ns.indexOf('.') + 1 );
			infos[ tag[0] ][ tag[2] ] = conn[collection].find().toArray();
		}

		do_ancestors( op, tag, infos[ tag[0] ][ 'ancestors' ] );
		do_embeddeds( op, tag, infos[ tag[0] ][ 'embeddeds' ] );
	}

	// Safety Trap for busy loop.
	if ( (new Date()) - now < 100 ) {
		break;
	}
}
