// Setup script using raw fetch to avoid SDK version mismatch
const PB_URL = 'http://192.168.44.251:8090';
const ADMIN_EMAIL = 'admin@web-nakhonpanom.local';
const ADMIN_PASS = '@Aa1234567';

async function main() {
    try {
        console.log(`Connecting to ${PB_URL}...`);

        // 1. Authenticate (v0.22 API path)
        const authRes = await fetch(`${PB_URL}/api/admins/auth-with-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identity: ADMIN_EMAIL, password: ADMIN_PASS })
        });

        if (!authRes.ok) {
            throw new Error(`Login failed: ${authRes.status} ${authRes.statusText}`);
        }

        const authData = await authRes.json();
        const token = authData.token;
        console.log('Login successful! Token acquired.');

        // Helper to find collection by name
        const findCollectionId = async (name) => {
            const res = await fetch(`${PB_URL}/api/collections/${name}`, {
                headers: { 'Authorization': token }
            });
            if (res.ok) {
                const data = await res.json();
                return data.id;
            }
            return null;
        };

        // Helper to create collection
        const createCollection = async (data) => {
            try {
                const res = await fetch(`${PB_URL}/api/collections`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': token
                    },
                    body: JSON.stringify(data)
                });

                if (res.ok) {
                    const created = await res.json();
                    console.log(`Collection "${data.name}" created. ID: ${created.id}`);
                    return created.id;
                } else {
                    const err = await res.json();
                    // If 400 and message contains "exists", might be duplicate.
                    // But PB API returns 400 for validation errors too.
                    if (JSON.stringify(err).includes('exists') || err.message?.includes('already exists')) {
                        console.log(`Collection "${data.name}" might already exist.`);
                        return await findCollectionId(data.name);
                    }

                    console.error(`Failed to create "${data.name}":`);
                    console.dir(err, { depth: null }); // Print deep object
                    return null;
                }
            } catch (e) {
                console.error(`Error creating "${data.name}":`, e.message);
                return null;
            }
        };

        // 2. Create 'officers' collection
        // Note: For select type, verify options format.
        const officersId = await createCollection({
            name: 'officers',
            type: 'base',
            schema: [
                { name: 'name', type: 'text', required: true },
                {
                    name: 'department',
                    type: 'select',
                    options: {
                        maxSelect: 1,
                        values: ['ฝ่ายทะเบียน', 'ฝ่ายรังวัด', 'กลุ่มงานวิชาการที่ดิน', 'ฝ่ายอำนวยการ']
                    }
                },
                { name: 'active', type: 'bool' }
            ]
        });

        if (!officersId) {
            console.error('Cannot proceed creating jobs because "officers" collection is missing.');
        } else {
            console.log(`Using "officers" ID: ${officersId} for relation.`);

            // 3. Create 'jobs' collection
            await createCollection({
                name: 'jobs',
                type: 'base',
                schema: [
                    { name: 'reception_no', type: 'text', required: true, options: { pattern: '' } }, // Unique constraint is done via index usually, or 'unique' prop in some versions? PB stores unique in options? No, it's NOT in options. It's distinct index. But let's basic fields first.
                    // Actually, 'text' field logic:
                    // In older PB, unique was a boolean on field? No, it's usually separate index. 
                    // Let's stick to basic definition.
                    {
                        name: 'department',
                        type: 'select',
                        options: {
                            maxSelect: 1,
                            values: ['ฝ่ายทะเบียน', 'ฝ่ายรังวัด', 'กลุ่มงานวิชาการที่ดิน', 'ฝ่ายอำนวยการ']
                        }
                    },
                    { name: 'job_type', type: 'text' },
                    { name: 'owner', type: 'text' },
                    {
                        name: 'status',
                        type: 'select',
                        options: {
                            maxSelect: 1,
                            values: ['pending', 'completed', 'cancelled']
                        }
                    },
                    { name: 'date', type: 'date' },
                    {
                        name: 'assignees',
                        type: 'relation',
                        options: {
                            collectionId: officersId,
                            cascadeDelete: false,
                            maxSelect: null // Unlimited select
                        }
                    }
                ]
            });
        }

    } catch (err) {
        console.error('Script failed:', err);
    }
}

main();
