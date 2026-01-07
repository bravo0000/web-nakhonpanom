// Script to add 'step' field to jobs collection
const PB_URL = 'http://192.168.44.251:8090';
const ADMIN_EMAIL = 'admin@web-nakhonpanom.local';
const ADMIN_PASS = '@Aa1234567';

async function main() {
    try {
        console.log(`Connecting to ${PB_URL}...`);

        // 1. Authenticate
        const authRes = await fetch(`${PB_URL}/api/admins/auth-with-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identity: ADMIN_EMAIL, password: ADMIN_PASS })
        });

        if (!authRes.ok) throw new Error(`Login failed: ${authRes.status}`);
        const token = (await authRes.json()).token;
        console.log('Login successful.');

        // 2. Get 'jobs' collection
        const findRes = await fetch(`${PB_URL}/api/collections/jobs`, {
            headers: { 'Authorization': token }
        });

        if (!findRes.ok) throw new Error('Jobs collection not found');
        const collection = await findRes.json();

        // 3. Add 'step' field if not exists
        const hasStep = collection.schema.find(f => f.name === 'step');
        if (hasStep) {
            console.log("'step' field already exists.");
            return;
        }

        console.log("Adding 'step' field...");
        collection.schema.push({
            name: 'step',
            type: 'text',
            required: false
        });

        // 4. Update collection
        const updateRes = await fetch(`${PB_URL}/api/collections/jobs`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            },
            body: JSON.stringify({ schema: collection.schema })
        });

        if (updateRes.ok) {
            console.log("'step' field added successfully!");
        } else {
            console.error("Failed to update collection:", await updateRes.json());
        }

    } catch (err) {
        console.error('Error:', err.message);
    }
}

main();
