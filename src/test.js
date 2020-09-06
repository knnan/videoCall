const { KurentoClientWrapper } = require( './lib/KurentoClientWrapper' );
const ws_uri = 'ws://localhost:8888/kurento';
// console.log( KurentoClientWrapper );
async function test ()
{
	try
	{
		const kclient = await KurentoClientWrapper.createClient( ws_uri );
		const pipeline = await KurentoClientWrapper.createPipeline( kclient );
		const webrtcEndpoint = await KurentoClientWrapper.createWebRtcEndpoint( pipeline );
		console.log( webrtcEndpoint );
	} catch ( error )
	{
		console.error( error );
	}
}

// test();

var part = {
	"a": {
		"id": 1,
		"likes": [ 'mango', 'dragonfruit' ],
		"alive": false
	},
	"b": {
		"id": 2,
		"likes": [ 'papaya', 'dragonfruit' ],
		"alive": false
	},
};

// let sub = part[ "a" ];
// console.log( part );
// console.log( sub );
// sub.alive = true;
// console.log( sub );
// console.log( part );

console.log( part[ "helo" ] );
if ( undefined )
{
	console.log( "null works" );
}
