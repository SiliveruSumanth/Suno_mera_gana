document.addEventListener("DOMContentLoaded", () => {

    const songInput = document.getElementById("song-input");
    const btn = document.getElementById("button-id");
    const errorMsg = document.querySelector(".errormsg");
    const output = document.querySelector(".find-out");

    let currentAudio = null;

    btn.addEventListener("click", searchSongs);
    songInput.addEventListener("keydown", e => {
        if (e.key === "Enter") searchSongs();
    });

    async function searchSongs() {
        const query = songInput.value.trim().toLowerCase();

        errorMsg.textContent = "";
        output.innerHTML = "";
        currentAudio = null;

        if (!query) {
            errorMsg.textContent = "Enter the song name";
            return;
        }

        try {
            const res = await fetch(
                `https://api.audius.co/v1/tracks/search?query=${encodeURIComponent(query)}`
            );

            if (!res.ok) {
                errorMsg.textContent = "Failed to fetch songs";
                return;
            }

            const { data: songs } = await res.json();

            if (!songs || songs.length === 0) {
                errorMsg.textContent = "No songs found";
                return;
            }

                            const words = query
                    .toLowerCase()
                    .normalize("NFKD")
                    .replace(/[_\-]/g, " ")
                    .replace(/[^\w\s]/g, "")
                    .split(/\s+/)
                    .filter(Boolean);

                const matchedSongs = songs.filter(song => {
                    const searchableText = [
                        song.title,
                        song.user?.name,
                        song.user?.handle,
                        song.genre,
                        song.description,
                        song.mood,
                        song.license,
                        song.isrc,
                        song.release_date,
                        song.remix_of?.title,
                        Array.isArray(song.tags) ? song.tags.join(" ") : null
                    ]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase()
                        .normalize("NFKD")
                        .replace(/[_\-]/g, " ")
                        .replace(/[^\w\s]/g, "")
                        .replace(/\s+/g, " ");

                    return words.every(word => searchableText.includes(word));
                });


            const playableSongs = matchedSongs.filter(
                s => Number.isFinite(s.duration) && s.duration > 1
            );

            if (playableSongs.length === 0) {
                errorMsg.textContent = "No matching playable songs found";
                return;
            }

            playableSongs.slice(0, 15).forEach(displaySong);

        } catch {
            errorMsg.textContent = "Something went wrong";
        }
    }

    function displaySong(song) {
        const card = document.createElement("div");
        card.className = "song-card";

        const image =
            song.artwork?.["480x480"] ||
            song.artwork?.["150x150"] ||
            "https://via.placeholder.com/300";

        const audioUrl = `https://api.audius.co/v1/tracks/${song.id}/stream`;

        card.innerHTML = `
            <img src="${image}" alt="cover">
            <h3>${song.title}</h3>
            <p><strong>Artist:</strong> ${song.user?.name || "Unknown"}</p>
            <p><strong>Genre:</strong> ${song.genre || "Not specified"}</p>
            <audio controls preload="metadata" src="${audioUrl}"></audio>
        `;

        const audio = card.querySelector("audio");

        audio.addEventListener("loadedmetadata", () => {
            if (!audio.duration || audio.duration === Infinity) {
                card.remove();
            }
        });

        audio.addEventListener("play", () => {
            if (currentAudio && currentAudio !== audio) {
                currentAudio.pause();
            }
            currentAudio = audio;
        });

        output.appendChild(card);
    }

});
