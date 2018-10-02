window.onSpotifyWebPlaybackSDKReady = () => {
    const token = prompt('please provide a spotify API Key (visit https://developer.spotify.com/documentation/web-playback-sdk/quick-start/ to get one):');
    const player = new Spotify.Player({
        name: 'Binge Transcribe',
        getOAuthToken: cb => { cb(token); }
    });

    window.player = player;

    // Error handling
    player.addListener('initialization_error', ({ message }) => { console.error(message); });
    player.addListener('authentication_error', ({ message }) => { console.error(message); });
    player.addListener('account_error', ({ message }) => { console.error(message); });
    player.addListener('playback_error', ({ message }) => { console.error(message); });

    // Playback status updates
    player.addListener('player_state_changed', state => { console.log(state); });

    // Ready
    player.addListener('ready', ({ device_id }) => {
        console.log('Ready with Device ID', device_id);
    });

    // Not Ready
    player.addListener('not_ready', ({ device_id }) => {
        console.log('Device ID has gone offline', device_id);
    });

    // Connect to the player!
    player.connect();
};


async function getPosition() {
    const state = await player.getCurrentState();
    return state.position;
}

let start = 0;
let end = 10000;
async function breakpoint() {
    window.position = await getPosition();
}

async function setLoopStart() {
    start = await getPosition();
}

async function setLoopEnd() {
    end = await getPosition();
}

let loopToggled = false;
async function toggleLoop() {
    if (!loopToggled) {
        loopToggled = true;
        return await activateLoop();
    } else {
        loopToggled = false;
    }
}

//TODO: account for when start and end are changed wildly

async function activateLoop() {
    // Enforce end comes after start
    (start > end) && ({start, end} = {end, start});

    // Prevent API floods
    if (end - start < 1000) {
        console.log('stopping too short loop');
        return;
    }

    // When toggle starts outside the loop
    let currentPosition = await getPosition();
    if (currentPosition > end) {
        console.log('loop ends before, seeking start');
        player.seek(start);
        currentPosition = start;
    }

    function loop() {
        if (!loopToggled) return;
        player.seek(start);
        console.log(`Looped. setting next loop in ${end-start}`)
        setTimeout(() => {
            loop();
        }, end-start);    
    }

    console.log(`setting next loop in ${end-currentPosition}`)
    setTimeout(() => {
        loop();
    }, end-currentPosition);

};
