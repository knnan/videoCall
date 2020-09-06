export default {
    generateRandomString ()
    {
        return Math.random().toString( 36 ).slice( 2 ).substring( 0, 15 );
    },


    closeVideo ( elemId )
    {
        if ( document.getElementById( elemId ) )
        {
            document.getElementById( elemId ).remove();
        }
    },


    pageHasFocus ()
    {
        return !( document.hidden || document.onfocusout || window.onpagehide || window.onblur );
    },


    getQString ( url = '', keyToReturn = '' )
    {
        url = url ? url : location.href;
        let queryStrings = decodeURIComponent( url ).split( '#', 2 )[ 0 ].split( '?', 2 )[ 1 ];

        if ( queryStrings )
        {
            let splittedQStrings = queryStrings.split( '&' );
            if ( splittedQStrings.length )
            {
                let queryStringObj = {};

                splittedQStrings.forEach( function ( keyValuePair )
                {
                    let keyValue = keyValuePair.split( '=', 2 );

                    if ( keyValue.length )
                    {
                        queryStringObj[ keyValue[ 0 ] ] = keyValue[ 1 ];
                    }
                } );

                return keyToReturn ? ( queryStringObj[ keyToReturn ] ? queryStringObj[ keyToReturn ] : null ) : queryStringObj;
            }

            return null;
        }

        return null;
    },


    userMediaAvailable ()
    {
        return !!( navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia );
    },


    getUserFullMedia ()
    {
        if ( this.userMediaAvailable() )
        {
            return navigator.mediaDevices.getUserMedia( {
                video: true,
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true
                }
            } );
        }

        else
        {
            throw new Error( 'User media not available' );
        }
    },


    getUserAudio ()
    {
        if ( this.userMediaAvailable() )
        {
            return navigator.mediaDevices.getUserMedia( {
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true
                }
            } );
        }

        else
        {
            throw new Error( 'User media not available' );
        }
    },



    shareScreen ()
    {
        if ( this.userMediaAvailable() )
        {
            return navigator.mediaDevices.getDisplayMedia( {
                video: {
                    cursor: "always"
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                }
            } );
        }

        else
        {
            throw new Error( 'User media not available' );
        }
    },


    getIceServer ()
    {
        // "turns:eu-turn4.xirsys.com:5349?transport=tcp"
        // "turns:eu-turn4.xirsys.com:443?transport=tcp"
        // "turn:eu-turn4.xirsys.com:80?transport=tcp",
        // "turn:eu-turn4.xirsys.com:3478?transport=udp",
        return {
            iceServers: [
                {
                    urls: [ "stun:eu-turn4.xirsys.com" ]
                },
                {
                    username: "ml0jh0qMKZKd9P_9C0UIBY2G0nSQMCFBUXGlk6IXDJf8G2uiCymg9WwbEJTMwVeiAAAAAF2__hNSaW5vbGVl",
                    credential: "4dd454a6-feee-11e9-b185-6adcafebbb45",
                    urls: [
                        "turn:eu-turn4.xirsys.com:80?transport=udp",
                        "turn:eu-turn4.xirsys.com:3478?transport=tcp"
                    ]
                }
            ]
        };
    },




    toggleChatNotificationBadge ()
    {
        if ( document.querySelector( '#chat-pane' ).classList.contains( 'chat-opened' ) )
        {
            document.querySelector( '#new-chat-notification' ).setAttribute( 'hidden', true );
        }

        else
        {
            document.querySelector( '#new-chat-notification' ).removeAttribute( 'hidden' );
        }
    },



    replaceTrack ( stream, recipientPeer )
    {
        let sender = recipientPeer.getSenders ? recipientPeer.getSenders().find( s => s.track && s.track.kind === stream.kind ) : false;

        sender ? sender.replaceTrack( stream ) : '';
    },





    saveRecordedStream ( stream, user )
    {
        let blob = new Blob( stream, { type: 'video/webm' } );

        let file = new File( [ blob ], `${ user }-${ moment().unix() }-record.webm` );

        saveAs( file );
    },




    setLocalStream ( stream, mirrorMode = true )
    {
        const localVidElem = document.getElementById( 'local' );

        localVidElem.srcObject = stream;
        mirrorMode ? localVidElem.classList.add( 'mirror-mode' ) : localVidElem.classList.remove( 'mirror-mode' );
    },




};












