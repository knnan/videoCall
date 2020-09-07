require( 'dotenv' ).config( { path: '../config/.env' } );
const path = require( 'path' );
const express = require( 'express' );
const app = express();
const server = require( 'http' ).Server( app );
const io = require( 'socket.io' )( server );
const { KurentoClientWrapper } = require( './lib/KurentoClientWrapper' );
const minimist = require( 'minimist' );
const socketAuth = require( 'socketio-auth' );
const adapter = require( 'socket.io-redis' );
const redis = require( './lib/redis' );
const fetch = require( 'node-fetch' );
const Bluebird = require( 'bluebird' );
fetch.Promise = Bluebird;


// GLOBAL VARIABLES
var AUTHENTICATED_LIST = {};
var iceCandidatesQueue = {};




const redisAdapter = adapter( {
	host: process.env.REDIS_HOST || 'localhost',
	port: process.env.REDIS_PORT || 6379,
} );
io.adapter( redisAdapter );

// EXPRESS MIDDLEWARES
app.use( express.json() );
app.use( express.urlencoded( { extended: false } ) );
app.use( express.static( path.join( __dirname, '../public' ) ) );


// Beginning of app code


/* 
user camelcase(camelCase) for normal variables
user smallcase(smallcase) for function arguments
use allcaps(ALLCAPS) for global variables
*/





// UTILITY FUNCTIONS 
// TODO : put todo function in a separate util file  
function getRoomObject ( roomname )
{
	return io.sockets.adapter.rooms[ msg.roomName ] !== undefined ? io.sockets.adapter.rooms[ msg.roomName ] : undefined;
}












/* 
function to verify the user based on a token provided
*/
async function verifyUser ( token )
{

	try
	{
		let pre_json = await fetch( auth_url, {
			method: 'get',
			headers: { "access-token": token },
		} );
		let data = await pre_json.json();
		console.log( 'verifying user' );
		console.log( 'data', data );
		if ( data.status == 200 )
		{
			console.log( data );
			let userInfo = {
				userId: data.user_id,
				userName: data.full_name,
				type: data.user_type,
				accessToken: data.access_token,
				isPresenter: data.presenter,
				isGuest: data.guest,
				photo: data.photo != '' ? data.photo : "assets/images/no-photo.png",
			};
			return userInfo;
		}
		return null;

	} catch ( error )
	{
		reject( error.message );
	}
}






socketAuth( io, {
	authenticate: async ( socket, data, callback ) =>
	{
		const { token, roomName } = data;

		try
		{
			const user = await verifyUser( token );
			if ( user == null )
			{
				throw new Error( 'user is null' );
			}
			const canConnect = await redis.setAsync( `users:${ user.userId }`, socket.id, 'NX', 'EX', 30 );
			if ( !canConnect )
			{
				return callback( { message: 'ALREADY_LOGGED_IN' } );
			}
			socket.auth = true;
			socket.user = user;
			socket.user.roomName = roomName;
			console.log( `Socket ${ socket.id } Authenticated.` );
			if ( user.type.toUpperCase() == 'EMPLOYEE' )
			{
				socket.user.isPresenter = true;
				console.log( 'presenter found' );
			}
			return callback( null, true );
		} catch ( e )
		{
			console.log( `Socket ${ socket.id } UNAUTHORIZED.` );
			return callback( { message: 'UNAUTHORIZED' } );
		}
	},
	postAuthenticate: async ( socket ) =>
	{

		/* 
		renewing the user auth after a predefined interval each time for 30 seconds
		*/
		socket.conn.on( 'packet', async ( packet ) =>
		{
			if ( socket.auth && packet.type === 'ping' )
			{
				await redis.setAsync( `users:${ socket.user.userId }`, socket.id, 'XX', 'EX', 30 ); // set the key only if it already exist
			}
		} );

		socket.on( 'message', ( message ) =>
		{
			switch ( message.event )
			{
				case 'JOIN_ROOM':
					joinRoom();
					break;
				case 'RECIEVE_MEDIA_FROM':
					recieveMediaFrom( socket, message.from, message.sdpOffer, message.type );
					break;
				case 'ICECANDIDATE':
					addIceCandidateFromPeers( socket, socket.user.userId, message.candidate, message.type );
					break;
				default:
					break;
			}
		} );


		// send authenicated message to client
		socket.emit( 'user-authenticated', socket.user );


		socket.on( 'disconnect', async () =>
		{

			console.log( `Socket ${ socket.id } disconnected. in unauthenticated` );
			console.log( 'socket.user is' );
			console.log( socket.user );
			if ( socket.user )
			{
				console.log( 'remove redis entry in postauthencation' );
				await redis.delAsync( `users:${ socket.user.userId }` );
				if ( socket.user.isPresenter == true )
				{
					// presenterLeaving( socket, socket.id );

				}
				else
				{
					// participantLeaving( socket, socket.id, socket.roomName );
				}
			}

		} );



	},
	disconnect: async ( socket ) =>
	{/* 
	//* Mostly reduntant code block as the same is being handled by socket.on(disconnect) function above

		console.log( `Socket ${ socket.id } disconnected. in unauthenticated` );
		console.log( 'socket.user is' );
		console.log( socket.user );
		if ( socket.user )
		{
			console.log( 'remove redis entry in postauthencation' );
			await redis.delAsync( `users:${ socket.user.userId }` );
		}
		console.log( 'unauthencated user has been disconnected' );
	 */},
} );

function sendLocalCandidates ( event, socket, type )
{

	let candidate = kurento.register.complexTypes.IceCandidate( event.candidate );
	socket.emit( 'message', {
		event: 'candidate',
		userInfo: socket.user,
		candidate: candidate,
		type: type
	} );


}

function addIceCandidateFromPeers ( socket, senderId, iceCandidate, type )
{
	try
	{
		if ( getRoomObject( socket.user.roomName ).participants[ socket.user.userId ] != undefined )
		{
			let LocalUser = getRoomObject( socket.user.roomName ).participants[ socket.user.userId ];
			let kurento = getRoomObject( socket.user.roomName ).kclient;
			let candidate = kurento.register.complexTypes.IceCandidate( iceCandidate );
			if ( senderId == socket.user.userId )
			{
				if ( type == 'webcam' )
				{
					if ( LocalUser.outgoingMedia )	
					{
						LocalUser.outgoingMedia.addIceCandidate( candidate );
					}
					else
					{
						iceCandidatesQueue[ socket.user.roomName ][ socket.user.userId ][ 'webcam' ].push( { candidate: candidate } );
					}
				}
				else if ( type == 'screen' )
				{
					if ( LocalUser.outgoingScreenMedia )	
					{
						LocalUser.outgoingScreenMedia.addIceCandidate( candidate );
					}
					else
					{
						iceCandidatesQueue[ socket.user.roomName ][ socket.user.userId ][ 'screen' ].push( { candidate: candidate } );
					}
				}
			}
			else
			{
				if ( type == 'webcam' )
				{

					if ( LocalUser.incomingMedia[ senderId ] )
					{
						LocalUser.incomingMedia[ senderId ].addIceCandidate( candidate );
					} else
					{
						if ( !iceCandidatesQueue[ socket.user.roomName ][ senderId ][ 'webcam' ] )
						{
							iceCandidatesQueue[ socket.user.roomName ][ senderId ][ 'webcam' ] = [];
						}
						iceCandidatesQueue[ socket.user.roomName ][ senderId ][ 'webcam' ].push( { candidate: candidate } );
					}
				}
				else if ( type == 'screen' )
				{
					if ( LocalUser.incomingScreenMedia[ senderId ] )
					{
						LocalUser.incomingScreenMedia[ senderId ].addIceCandidate( candidate );
					} else
					{
						if ( !iceCandidatesQueue[ socket.user.roomName ][ senderId ][ 'screen' ] )
						{
							iceCandidatesQueue[ socket.user.roomName ][ senderId ][ 'screen' ] = [];
						}
						iceCandidatesQueue[ socket.user.roomName ][ senderId ][ 'screen' ].push( { candidate: candidate } );
					}
				}

			}
		}
	} catch ( err )
	{
		console.log( err );
	}

}




async function joinRoom ( socket )
{

	/* 
	TODO: check if presenter is already in the rooom othewise reject the joinRoom 
	*/
	try
	{

		let myRoom = await getRoom( socket );
		let kurento = myRoom.kclient;
		let roomUser = {
			id: socket.user.userId,
			socketId: socket.id,
			outgoingMedia: null,
			outgoingScreenMedia: null,
			incomingMedia: {},
			incomingScreenMedia: {},
			userInfo: socket.user,
		};
		myRoom.participants[ socket.user.userId ] = roomUser;

		//create webrtcEndpoint for video and screen output
		const outgoingMedia = await KurentoClientWrapper.createWebRtcEndpoint( myRoom.pipeline );
		const outgoingScreenMedia = await KurentoClientWrapper.createWebRtcEndpoint( myRoom.pipeline );
		roomUser.outgoingMedia = outgoingMedia;
		roomUser.outgoingScreenMedia = outgoingScreenMedia;

		//TODO: make a utility function to handle the below code reuse code

		let iceCandidateQueue = iceCandidatesQueue[ socket.user.roomName ][ socket.user.userId ];

		while ( iceCandidateQueue[ 'webcam' ] )
		{
			let ice = iceCandidateQueue[ 'webcam' ].shift();
			roomUser.outgoingMedia.addIceCandidate( ice.candidate );
		}
		while ( iceCandidateQueue[ 'screen' ] )
		{
			let ice = iceCandidateQueue[ 'screen' ].shift();
			roomUser.outgoingScreenMedia.addIceCandidate( ice.candidate );
		}

		roomUser.outgoingMedia.on( 'OnIceCandidate', event =>
		{
			let candidate = kurento.register.complexTypes.IceCandidate( event.candidate );
			socket.emit( 'message', {
				event: 'candidate',
				userInfo: socket.user,
				candidate: candidate,
				type: 'webcam'
			} );
		} );
		roomUser.outgoingScreenMedia.on( 'OnIceCandidate', event =>
		{
			let candidate = kurento.register.complexTypes.IceCandidate( event.candidate );
			socket.emit( 'message', {
				event: 'candidate',
				userInfo: socket.user,
				candidate: candidate,
				type: 'screen'
			} );
		} );

		socket.to( socket.user.roomName ).emit( 'message', {
			event: 'NEW_PARTICIPANT',
			userInfo: socket.user
		} );
		let existingUsers = [];
		for ( participant in myRoom.participants[ socket.user.userId ] );
		{
			if ( participant != socket.user.userId )
			{
				existingUsers.push( {
					socketId: myRoom.participants[ participant ].socketId,
					userInfo: myRoom.participants[ participant ].userInfo
				} );
			}
		}
		socket.emit( 'message', {
			event: 'EXISTING_PARTICIPANTS',
			userInfo: socket.user,
			existingUsers: existingUsers,
		} );
	} catch ( err )
	{
		console.log( err );
	}

}


async function recieveMediaFrom ( socket, from, offer, type )
{
	try
	{

		let endpoint = await getEndpoingForUser( socket, from, type );
		let answer = await KurentoClientWrapper.getAnswer( endpoint, offer );
		socket.emit( 'message', {
			event: 'receiveMediaAnswer',
			senderId: from,
			sdpAnswer: answer,
			type: type
		} );
	} catch ( err )
	{
		console.log( err );
	}

}

async function getEndpoingForUser ( socket, from, type )
{
	try
	{

		let myRoom = getRoomObject( socket.user.roomName );
		let kurento = myRoom.kclient;
		let asker = myRoom.participants[ socket.user.userId ];
		let sender = myRoom.participants[ from ];
		if ( sender == null )
		{

		}
		if ( asker.id === sender.id )
		{
			return type == 'webcam' ? asker.outgoingMedia : asker.outgoingScreenMedia;
		}
		if ( type == 'webcam' )
		{
			if ( asker.incomingMedia[ sender.id ] ) 
			{
				await KurentoClientWrapper.connectEndpoints( sender.outgoingMedia, asker.incomingMedia[ sender.id ] );
				return asker.incomingMedia[ sender.id ];
			}
			else
			{
				const incoming = await KurentoClientWrapper.createWebRtcEndpoint( myRoom.pipeline );
				asker.incomingMedia[ sender.id ] = incoming;

				let iceCandidateQueue = iceCandidatesQueue[ socket.user.roomName ][ sender.id ];

				while ( iceCandidateQueue[ 'webcam' ] )
				{
					let ice = iceCandidateQueue[ 'webcam' ].shift();
					roomUser.outgoingMedia.addIceCandidate( ice.candidate );
				}
				incoming.on( 'OnIceCandidate', event =>
				{
					let candidate = kurento.register.complexTypes.IceCandidate( event.candidate );
					socket.emit( 'message', {
						event: 'candidate',
						userInfo: socket.user,
						candidate: candidate,
						type: 'webcam'
					} );
				} );
				await KurentoClientWrapper.connectEndpoints( sender.outgoingMedia, asker.incomingMedia[ sender.id ] );
				return incoming;

			}
		}
		else if ( type == 'screen' )
		{
			if ( asker.incomingScreenMedia[ sender.id ] ) 
			{
				await KurentoClientWrapper.connectEndpoints( sender.outgoingScreenMedia, asker.incomingScreenMedia[ sender.id ] );
				return asker.incomingScreenMedia[ sender.id ];
			}
			else
			{
				const incoming = await KurentoClientWrapper.createWebRtcEndpoint( myRoom.pipeline );
				asker.incomingScreenMedia[ sender.id ] = incoming;

				let iceCandidateQueue = iceCandidatesQueue[ socket.user.roomName ][ sender.id ];

				while ( iceCandidateQueue[ 'screen' ] )
				{
					let ice = iceCandidateQueue[ 'screen' ].shift();
					roomUser.outgoingScreenMedia.addIceCandidate( ice.candidate );
				}
				incoming.on( 'OnIceCandidate', event =>
				{
					let candidate = kurento.register.complexTypes.IceCandidate( event.candidate );
					socket.emit( 'message', {
						event: 'candidate',
						userInfo: socket.user,
						candidate: candidate,
						type: 'screen'
					} );
				} );
				await KurentoClientWrapper.connectEndpoints( sender.outgoingScreenMedia, asker.incomingScreenMedia[ sender.id ] );
				return incoming;

			}
		}
	} catch ( err )
	{
		console.log( err );
	}

}



async function getRoom ( socket ) // TODO send url parameter for kurento url
{
	try
	{
		let myRoom = getRoomObject( socket.user.roomName );
		if ( myRoom === undefined ) // executes when the first person joins the room(one time room setup)
		{
			socket.join( roomname, () =>
			{
				const kclient = await KurentoClientWrapper.createClient( process.env.ws_uri );
				const pipeline = await KurentoClientWrapper.createPipeline( kclient );
				myRoom.kclient = kclient;
				myRoom.presenter = socket.user.isPresenter ? socket.user.userId : null;
				myRoom.pipeline = pipeline;
				myRoom.participants = {};
			} );
		}
		else 
		{
			socket.join( roomname );
		}
		return myRoom;
	}
	catch ( err )
	{
		console.error( err );
	}
}
































app.get( '/api/', ( req, res, next ) =>
{
	res.send( 'You have reached the root page' );
} );


const PORT = process.env.PORT || 3000;
server.listen( PORT, () => console.log( `server started on port ${ PORT }` ) );
