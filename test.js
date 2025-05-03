import bandcampFetch from 'bandcamp-fetch';

async function testBandcampFetch() {
    try {
        const results = await bandcampFetch.searchAlbums({ query: 'The Beatles' }); // Replace with a valid search term
        console.log(results);
    } catch (error) {
        console.error('Error:', error);
    }
}

testBandcampFetch();
