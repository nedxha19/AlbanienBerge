import { createConnection } from '$lib/mysql.js';


const USERNAME = 'admin';
const PASSWORD = 'secret';

export async function GET({ params }) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !isValidCredentials(authHeader)) {
        return new Response('Unauthorized', {
            status: 401,
            headers: { 'WWW-Authenticate': 'Basic realm="Secure Area"' }
        });
    }

    const connection = await createConnection();
    const [rows] = await connection.execute('SELECT * FROM mountains WHERE id = ?', [params.uuid]);
    await connection.end();

    return new Response(JSON.stringify(rows), {
        status: 200,
        headers: { 'content-type': 'application/json' }
    });
}

export async function POST({ request }) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !isValidCredentials(authHeader)) {
        return new Response('Unauthorized', {
            status: 401,
            headers: { 'WWW-Authenticate': 'Basic realm="Secure Area"' }
        });
    }

    const connection = await createConnection();
    const body = await request.json();

    if (!body.name || !body.height || !body.location) {
        await connection.end();
        return new Response(JSON.stringify({ error: 'Missing required fields' }), {
            status: 400,
            headers: { 'content-type': 'application/json' }
        });
    }

    const [result] = await connection.execute(
        'INSERT INTO mountains (name, height, location) VALUES (?, ?, ?);',
        [body.name, body.height, body.location]
    );

    const newMountain = {
        id: result.insertId,
        name: body.name,
        height: body.height,
        location: body.location
    };

    await connection.end();
    return new Response(JSON.stringify(newMountain), {
        status: 201,
        headers: { 'content-type': 'application/json' }
    });
}

export async function DELETE({ params }) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !isValidCredentials(authHeader)) {
        return new Response('Unauthorized', {
            status: 401,
            headers: { 'WWW-Authenticate': 'Basic realm="Secure Area"' }
        });
    }

    const connection = await createConnection();
    const { uuid } = params;
    const id = parseInt(uuid, 10);

    try {
        const [result] = await connection.execute(
            'DELETE FROM mountains WHERE id = ?;',
            [id]
        );

        if (result.affectedRows === 0) {
            await connection.end();
            return new Response(JSON.stringify({ error: 'Mountain not found' }), {
                status: 404,
                headers: { 'content-type': 'application/json' }
            });
        }

        await connection.end();
        return new Response(null, {
            status: 204,
            headers: { 'content-type': 'application/json' }
        });

    } catch (error) {
        await connection.end();
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'content-type': 'application/json' }
        });
    }
}

export async function PUT({ params, request }) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !isValidCredentials(authHeader)) {
        return new Response('Unauthorized', {
            status: 401,
            headers: { 'WWW-Authenticate': 'Basic realm="Secure Area"' }
        });
    }

    const connection = await createConnection();
    const { uuid } = params;
    const id = parseInt(uuid, 10);

    try {
        const body = await request.json();

        if (!body.name || !body.height || !body.location) {
            await connection.end();
            return new Response(JSON.stringify({ error: 'Missing required fields' }), {
                status: 400,
                headers: { 'content-type': 'application/json' }
            });
        }

        const [result] = await connection.execute(
            'UPDATE mountains SET name = ?, height = ?, location = ? WHERE id = ?;',
            [body.name, body.height, body.location, id]
        );

        if (result.affectedRows === 0) {
            await connection.end();
            return new Response(JSON.stringify({ error: 'Mountain not found' }), {
                status: 404,
                headers: { 'content-type': 'application/json' }
            });
        }

        const updatedMountain = {
            id,
            name: body.name,
            height: body.height,
            location: body.location
        };

        await connection.end();
        return new Response(JSON.stringify(updatedMountain), {
            status: 200,
            headers: { 'content-type': 'application/json' }
        });

    } catch (error) {
        await connection.end();
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'content-type': 'application/json' }
        });
    }
}

function isValidCredentials(authHeader) {
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = atob(base64Credentials);
    const [username, password] = credentials.split(':');

    return username === USERNAME && password === PASSWORD;
}