console.log( 'client.js is running perfectly' );
import helpers from './helpers.js';
let socket;
var GLOBAL_USER_ID = undefined;
var CLIENT_PRESENTER_ID = undefined;
var GLOBAL_USER_INFO = undefined;
var MY_WEBCAM_STREAM = undefined;
var MY_SCREEN_STREAM = undefined;
var participantcount = 1;
var participants = {};
window.globalparticipants = participants;
const offerOptions = {
    offerToReceiveAudio: 1,
    offerToReceiveVideo: 1
};
var recordedStream = [];
var mediaRecorder = '';

socket = io( {
    autoConnect: false,
    pingInterval: 10000,
    pingTimeout: 29000,
} );


socket.on( 'connect', () =>
{
    const roomName = helpers.getQString( location.href, 'room' );
    const authToken = helpers.getQString( location.href, 'token' );
    console.log( { roomName } );
    console.log( { authToken } );
    // Sending the userinfo to the server for authentication
    socket.emit( 'authentication', {
        token: authToken,
        roomName: roomName
    } );
    console.log( { roomName, authToken } );
} );



socket.on( 'user-authenticated', ( data ) =>
{
    console.log( 'receive user-authenticated' );
    let message = {
        event: 'JOIN_ROOM',
    };
    sendMessage( message );
} );



socket.on( 'message', message =>
{
    if ( message.event != 'candidate' )
        console.log( 'Message received: ' + message.event );


    switch ( message.event )
    {
        case 'NEW_PARTICIPANT':
            onNewParticipant( message.userInfo );
            break;
        case 'EXISTING_PARTICIPANTS':
            onExistingParticipants( message.userInfo, message.existingUsers );
            break;
        case 'receiveMediaAnswer':
            onReceiveMediaAnswer( message.senderId, message.sdpAnswer, message.type );
            break;
        case 'candidate':
            console.log( message.place );
            addIceCandidate( message.userInfo, message.candidate, message.type );
            break;
        default:
            break;
    }
} );




function setLocalstream ( stream, id )
{
    let localVideo = document.querySelector( id );
    localVideo.srcObject = stream;
} ``;

function gotRemoteStream ( userInfo )
{
    let newVid = document.createElement( 'video' );
    newVid.id = `${ userInfo.userId }-video`;
    newVid.autoplay = true;
    newVid.muted = true;
    newVid.controls = true;
    newVid.className = 'remote-video';

    newVid.innerHTML = ` <source src="/home/knnan/Desktop/sample.mp4" type="video/mp4">`;
    let controlDiv = document.createElement( 'div' );
    controlDiv.id = `${ userInfo.userId }-controls`;


    controlDiv.appendChild( newVid );
    document.getElementById( 'maincont' ).appendChild( controlDiv );
    return newVid;

}


function onNewParticipant ( userInfo )
{
    // receiveMedia( userInfo, 'webcam' );

}

async function onExistingParticipants ( userInfo, existingUsers )
{

    try
    {
        console.log( { existingUsers } );
        CLIENT_PRESENTER_ID = userInfo.isPresenter ? userInfo.userId : undefined;
        if ( userInfo.isPresenter || true )
        {
            await setupAndSendWEBCAM( userInfo );
        }
        existingUsers.forEach( ( element ) =>
        {
            receiveMedia( element.userInfo, 'webcam' );
        } );


    } catch ( error )
    {
        console.log( error );
    }
}

async function receiveMedia ( userInfo, type )
{
    try
    {
        console.log( "this is happeneing" );
        let user = null;
        if ( participants[ userInfo.userId ] === undefined )
        {
            user = {
                id: userInfo.userId,
                userInfo: userInfo,
                rtcPeer: null,
                screenPeer: null,
            };
            participants[ userInfo.userId ] = user;
        } else
        {
            user = participants[ userInfo.userId ];
        }


        if ( type == 'webcam' )
        {

            // user.rtcPeer = new RTCPeerConnection();
            // user.rtcPeer.onicecandidate = e => onicecandidateHandler( e, userInfo, 'webcam' );
            // user.rtcPeer.ontrack = e => gotRemoteStream( e, '#remotevideo' );



            var options = {
                remoteVideo: gotRemoteStream( userInfo ),
                onicecandidate: webcamOnIceCandidate,
                onaddstream: addstrem
            };


            user.rtcPeer = kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly( options,
                function ( err )
                {
                    if ( err )
                    {
                        return console.error( err );
                    }
                    this.generateOffer( onOffer );
                }
            );
            user.rtcPeer.ontrack = ( e ) =>
            {
                console.log( 'got the stream for ' );
                console.log( userInfo );
                console.log( e );

            };

            function addstrem ( event )
            {
                console.log( 'got the stream for ' );
                console.log( userInfo );
                console.log( event );


            };


            function onOffer ( err, offer, wp )
            {
                if ( err )
                {
                    console.log( err );
                    return;
                }
                console.log( 'sending offer' );

                // var message = {
                //     event: 'receiveVideoFrom',
                //     userid: user.id,
                //     roomName: roomName,
                //     sdpOffer: offer
                // };
                let message = {
                    event: 'RECIEVE_MEDIA_FROM',//receive my video
                    from: userInfo.userId, // to
                    sdpOffer: offer,
                    type: 'webcam'
                };
                sendMessage( message );

            };
            function webcamOnIceCandidate ( candidate )
            {
                // console.log( 'sending ice candidates' );
                onicecandidateHandler( candidate, type );
            }

        }

    } catch ( error )
    {
        console.log( error );
    }
}



async function setupAndSendWEBCAM ( userInfo )
{

    try
    {
        let user = null;
        MY_WEBCAM_STREAM = await helpers.getUserFullMedia();

        // setLocalstream( MY_WEBCAM_STREAM, '#localvideo' );
        if ( participants[ userInfo.userId ] === undefined )
        {
            user = {
                id: userInfo.userId,
                userInfo: userInfo,
                rtcPeer: null,
                screenPeer: null,
            };
            participants[ userInfo.userId ] = user;
        } else
        {
            user = participants[ userInfo.userId ];
        }


        let options = {
            localVideo: document.getElementById( 'localvideo' ),
            videoStream: MY_WEBCAM_STREAM,
            mediaConstraints: {},
            onicecandidate: webcamOnIceCandidate,
            sendSource: 'screen'
        };


        user.rtcPeer = kurentoUtils.WebRtcPeer.WebRtcPeerSendonly( options,
            function ( err )
            {
                if ( err )
                {
                    return console.error( err );
                }
                this.generateOffer( onOffer );
            }
        );

        function onOffer ( err, offer, wp )
        {
            if ( err )
            {
                console.log( err );
                return;
            }
            console.log( 'sending offer' );

            // var message = {
            //     event: 'receiveVideoFrom',
            //     userid: user.id,
            //     roomName: roomName,
            //     sdpOffer: offer
            // };
            let message = {
                event: 'RECIEVE_MEDIA_FROM',//receive my video
                from: userInfo.userId, // to
                sdpOffer: offer,
                type: 'webcam'
            };
            sendMessage( message );

        };
        function webcamOnIceCandidate ( candidate )
        {
            console.log( 'sending ice candidates' );
            onicecandidateHandler( candidate, 'webcam' );
        }

    } catch ( error )
    {
        console.log( error );
    }

}

function onicecandidateHandler ( candidate, type )
{
    let message = {
        event: 'ICECANDIDATE',
        candidate: candidate,
        type: type
    };
    sendMessage( message );
}

async function onnegotiationneededHandler ( pc, userInfo, type )
{
    console.log( { userInfo } );
    try
    {
        let offer = await pc.createOffer( offerOptions );
        console.log( 'sending offer' );
        console.log( offer );
        let message = {
            event: 'RECIEVE_MEDIA_FROM',//receive my video
            from: userInfo.userId, // to
            sdpOffer: offer,
            type: type
        };
        sendMessage( message );

    } catch ( error )
    {
        console.log( error );
    }
};


async function addIceCandidate ( userInfo, candidate, type )
{
    try
    {
        // candidate = candidate.candidate;
        candidate = new RTCIceCandidate( candidate );

        // console.log( `receiving candidate` );
        if ( type == 'webcam' )
        {
            await participants[ userInfo.userId ].rtcPeer.addIceCandidate( candidate );
        }
        else
        {
            await participants[ userInfo.userId ].screenPeer.addIceCandidate( candidate );

        }

    } catch ( error )
    {
        console.log( error );
    }

}

async function onReceiveMediaAnswer ( senderId, sdpanswer, type )
{
    try
    {
        // let sdpanswer = new RTCSessionDescription( {
        //     type: 'answer',
        //     sdp: answer
        // } );
        if ( type == 'webcam' )
        {
            await participants[ senderId ].rtcPeer.processAnswer( sdpanswer );
        }
        else
        {
            await participants[ senderId ].screenPeer.processAnswer( sdpanswer );

        }
    } catch ( error )
    {
        console.log( error );
    }

}






function sendMessage ( message )
{
    // console.log( 'sending ' + message.event + ' message to server' );
    socket.emit( 'message', message );
}

socket.open();
