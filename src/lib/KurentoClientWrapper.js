//@ts-check
const kurentoClient = require( 'kurento-client' );

/**
 * Collection of Kurento operations. Promise wrappers around kurento-client
 */
class KurentoClientWrapper
{
	/**
	* @param {string} wsUri
	* @return {Promise<import('kurento-client')>};
	*/

	static createClient ( wsUri )
	{
		return new Promise( ( resolve, reject ) =>
		{
			if ( KurentoClientWrapper.client )
			{
				return resolve( KurentoClientWrapper.client );
			}
			const timeout = setTimeout( () =>
			{
				console.error( `kurentoClient didn't created by timeout` );
				reject( new Error( `kurentoClient didn't created by timeout` ) );
			}, 10000 );
			//@ts-ignore
			kurentoClient( wsUri, ( err, client ) =>
			{
				if ( err )
				{
					console.error( `kurento client didn't created`, wsUri, err );
					return reject( err );
				}
				console.log( `kurento client created, server address: "${ wsUri }"` );
				clearTimeout( timeout );
				KurentoClientWrapper.client = client;
				return resolve( client );
			} );
		} );
	}

	static createPipeline ( kClient )
	{
		return new Promise( ( resolve, reject ) =>
		{
			kClient.create( 'MediaPipeline', ( err, pipeline ) =>
			{
				const timeout = setTimeout( () =>
				{
					console.error( `pipeline didn't created by timeout` );
					reject( new Error( `pipeline didn't created by timeout` ) );
				}, 10000 );
				if ( err )
				{
					console.error( `pipeline didn't created`, err, pipeline );
					return reject( err );
				}
				clearTimeout( timeout );
				console.log( `Pipeline created successfully ` );
				resolve( pipeline );
			} );
		} );
	}

	/**
	 * @param {import('kurento-client-core').MediaPipeline} pipeline
	 * @return {Promise<import('kurento-client-elements').WebRtcEndpoint>}
	 */
	static createWebRtcEndpoint ( pipeline )
	{
		return new Promise( ( resolve, reject ) =>
		{
			const timeout = setTimeout( () =>
			{
				console.error( `WebRtcEndpoint didn't created by timeout` );
				reject( new Error( `WebRtcEndpoint didn't created by timeout` ) );
			}, 10000 );
			pipeline.create( 'WebRtcEndpoint', { useDataChannels: true }, ( err, webRtcEndpoint ) =>
			{
				if ( err )
				{
					console.error( `pipeline didn't created`, err, pipeline );
					return reject( err );
				}
				clearTimeout( timeout );
				resolve( webRtcEndpoint );
			} );
		} );
	}

	/**
	 * @param {import('kurento-client-core').MediaPipeline} pipeline
	 * @param {string} uri
	 * @return {Promise<import('kurento-client-elements').RecorderEndpoint>}
	 */
	static createRecorderEndpoint ( pipeline, uri )
	{
		return new Promise( ( resolve, reject ) =>
		{
			const timeout = setTimeout( () =>
			{
				console.error( `RecorderEndpoint didn't created by timeout` );
				reject( new Error( `RecorderEndpoint didn't created by timeout` ) );
			}, 10000 );
			const recorderEndpoint = pipeline.create( 'RecorderEndpoint', {
				uri,
			}, ( error ) =>
			{
				if ( error )
				{
					reject( error );
				}
				clearTimeout( timeout );
				resolve( recorderEndpoint );
			} );
		} );
	}

	/**
	 * @param {import('kurento-client-elements').RecorderEndpoint} recorderEndpoint
	 * @returns {Promise<void>}
	 */
	static startRecord ( recorderEndpoint )
	{
		return new Promise( ( resolve, reject ) =>
		{
			//@ts-ignore
			recorderEndpoint.record( ( err ) =>
			{
				if ( err )
				{
					reject( err );
				}
				resolve();
			} );
		} );
	}

	/**
	 * @return {string}
	 */
	static generateBaseRecordName ()
	{
		return `${ Date.now() }`;
	}

	/**
	 *
	 * @param {import('kurento-client-elements').WebRtcEndpoint} webRtcEndpoint
	 * @param {import('kurento-client-elements').WebRtcEndpoint|import('kurento-client-elements').RecorderEndpoint} someEndpoint
	 * @return {Promise<void>}
	 */
	static connectEndpoints ( webRtcEndpoint, someEndpoint )
	{
		return new Promise( ( resolve, reject ) =>
		{
			//@ts-ignore
			webRtcEndpoint.connect( someEndpoint, ( err ) =>
			{
				if ( err )
				{
					reject( err );
				}
				resolve();
			} );
		} );
	}

	/**
	 *
	 * @param {import('kurento-client-elements').WebRtcEndpoint} webRtcEndpoint
	 * @param {import('kurento-client-elements').WebRtcEndpoint|import('kurento-client-elements').RecorderEndpoint} someEndpoint
	 * @return {Promise<void>}
	 */
	static disconnectEndpoints ( webRtcEndpoint, someEndpoint )
	{
		return new Promise( ( resolve, reject ) =>
		{
			//@ts-ignore
			webRtcEndpoint.disconnect( someEndpoint, ( err ) =>
			{
				if ( err )
				{
					reject( err );
				}
				resolve();
			} );
		} );
	}

	/**
	 *
	 * @param {import('kurento-client-elements').WebRtcEndpoint} webRtcEndpoint
	 * @return {Promise<void>}
	 */
	static releaseEndpoint ( webRtcEndpoint )
	{
		return new Promise( ( resolve, reject ) =>
		{
			//@ts-ignore
			webRtcEndpoint.release( ( err ) =>
			{
				if ( err )
				{
					reject( err );
				}
				resolve();
			} );
		} );
	}

	/**
	 * @param {import('kurento-client-elements').WebRtcEndpoint|import('kurento-client-elements').RecorderEndpoint} endpoint
	 * @param {string} eventName
	 * @param {(evt: any) => void} callback
	 * @returns {void}
	 */
	static onEventEndpoint ( endpoint, eventName, callback )
	{
		//@ts-ignore
		endpoint.on( eventName, callback );
	}

	/**
	 *
	 * @param {import('kurento-client-elements').RecorderEndpoint} recorderEndpoint
	 * @return {Promise<void>}
	 */
	static pauseEndpoint ( recorderEndpoint )
	{
		return new Promise( ( resolve, reject ) =>
		{
			//@ts-ignore
			recorderEndpoint.pause( ( err ) =>
			{
				return err ? reject() : resolve();
			} );
		} );
	}

	/**
	 * @param {import('kurento-client-elements').WebRtcEndpoint|import('kurento-client-elements').RecorderEndpoint} someEndpoint
	 * @return {Promise<void>}
	 */
	static stopEndpoint ( someEndpoint )
	{
		return new Promise( ( resolve, reject ) =>
		{
			//@ts-ignore
			if ( !someEndpoint || !someEndpoint.stop )
			{ // often happens, call stopEndpoint if no endpoint here
				resolve();
			}
			//@ts-ignore
			someEndpoint.stop( ( err ) =>
			{
				if ( err )
				{
					reject( err );
				}
				resolve();
			} );
		} );
	}

	/**
	 * processAnswer and gatherCandidates
	 * @param {import('kurento-client-elements').WebRtcEndpoint} webRtcEndpoint
	 * @param {string} offer
	 * @return {Promise<string>}
	 */
	static getAnswer ( webRtcEndpoint, offer )
	{
		return new Promise( ( resolve, reject ) =>
		{
			//@ts-ignore
			webRtcEndpoint.processOffer( offer, ( errOffer, answer ) =>
			{
				if ( errOffer )
				{
					reject( errOffer );
				}
				webRtcEndpoint.gatherCandidates( ( errGather ) =>
				{
					if ( errGather )
					{
						reject( errGather );
					}
					resolve( answer );
				} );
			} );
		} );
	}

	/**
	 * @param {import('kurento-client-elements').WebRtcEndpoint} webRtcEndpoint
	 * @param {string} [prefix]
	 */
	static setDebugListeners ( webRtcEndpoint, prefix = '' )
	{
		/** taken from source kurento-client */
		const eventsArray = [
			// webRtcEndpoint events
			'DataChannelClose',
			'DataChannelOpen',
			// 'IceCandidateFound',
			'IceComponentStateChange',
			'IceGatheringDone',
			'NewCandidatePairSelected',
			'OnDataChannelClosed',
			'OnDataChannelOpened',
			// 'OnIceCandidate',
			// 'OnIceComponentStateChanged',
			'OnIceGatheringDone',
			'MediaFlowInStateChange',
			'MediaFlowOutStateChange',
			// BaseEndpoint events
			'ConnectionStateChanged',
			'MediaStateChanged',
		];

		eventsArray.forEach( ( eventName ) =>
		{
			//@ts-ignore
			webRtcEndpoint.on( eventName, ( event ) =>
			{
				console.log( prefix, eventName, JSON.stringify( event ) );
			} );
		} );
	}
}
/** @type {import('kurento-client')} */
KurentoClientWrapper.client = null;

module.exports.KurentoClientWrapper = KurentoClientWrapper;
