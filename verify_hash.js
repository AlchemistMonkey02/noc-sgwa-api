const bcrypt = require('bcryptjs');

const password = 'Password123!';
const hash = '$2b$10$0Ec2DXqpGJ1ydyh6HKYYputR.1WfS8TG8ftUfYx6LKdF0mF//mPgu';

bcrypt.compare(password, hash).then(res => {
    console.log(`Password: ${password}`);
    console.log(`Hash: ${hash}`);
    console.log(`Match: ${res}`);
}).catch(err => {
    console.error(err);
});
