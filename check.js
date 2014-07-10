var stop_collection = 'test.stop'; // database:test collection:stop

var option = DBQuery.Option.awaitData | DBQuery.Option.tailable;
var cursor = connect( 'local' ).oplog.rs.find().addOption( option );

var ts0 = null;
var ts1 = null;
for ( var stop = false, cursor = cursor.skip( cursor.count() ); !stop; ) {
	var now = new Date();
printjson( { time: now, status: 'start' } );

	while ( cursor.hasNext() ) {
		var op = cursor.next();
//printjson( op );

		ts0 = ts0 || op.ts;
		ts1 = op.ts;

		if ( op.ns === stop_collection ) {
			stop = true;
			break;
		}
	}

	var time = (new Date()) - now;
	if ( time < 100 ) {
		// Safety Trap for busy loop.
		break;
	} else {
		var span = 0;
		if (ts1 && ts0 )
			span = ts1.getTime() - ts0.getTime();
		printjson( { time: span, status: 'finish' } );
		ts0 = null;
		ts1 = null;
	}
}
