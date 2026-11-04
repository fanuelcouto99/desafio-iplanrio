const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const privateKey = fs.readFileSync(path.join(__dirname, '..', 'test-keys', 'test-private.pem'));

const sign = (sub, role) => {
    return jwt.sign({sub, role}, privateKey, {
        algorithm: 'RS256',
        issuer: 'corridas-teste', 
        expiresIn: '7d',
    })
};

console.log('TOKEN_PASSAGEIRO=' + sign('passageiro-1', 'passageiro'));
console.log('TOKEN_PASSAGEIRO_2=' + sign('passageiro-2', 'passageiro'));
console.log('TOKEN_MOTORISTA=' + sign('motorista-1', 'motorista'));