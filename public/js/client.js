console.log( 'client.js is running perfectly' );
import helpers from 'helpers.js';
let socket;
var GLOBAL_USER_ID = undefined;
var CLIENT_PRESENTER_ID = undefined;
var GLOBAL_USER_INFO = undefined;
var MY_WEBCAM_STREAM = undefined;
var MY_SCREEN_STREAM = undefined;

var pc = [];
var recordedStream = [];
var mediaRecorder = '';

socket = io( {
    autoConnect: false,
    pingInterval: 10000,
    pingTimeout: 29000,
} );


socket.on( 'connect', () =>
{
    ``;
    const room = helpers.getQString( location.href, 'room' );
    const authToken = helpers.getQString( location.href, 'token' );
    // Sending the userinfo to the server for authentication
    socket.emit( 'authentication', {
        token: authToken,
        roomName: roomName
    } );
    console.log( { roomName, authToken } );
} );





function onExistingParticipants ( userInfo, existingUsers )
{

    try
    {
        CLIENT_PRESENTER_ID = userInfo.isPresenter ? userInfo.userId : undefined;


    } catch ( error )
    {
        console.log( error );
    }
}

async function setupAndSendWEBCAM ( askerId )
{

    try
    {
        MY_SCREEN_STREAM = await helpes.getUserFullMedia();
        helpers;

    } catch ( error )
    {
        console.log( error );
    }

}
