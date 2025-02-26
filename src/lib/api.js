export async function fetchData() {
    const response = await fetch('/api/burgen', {
        method: 'GET',
        headers: {
            'Authorization': `Basic ${btoa('admin:secret')}`
        }
    });

    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

    return await response.json();
}