const { expect } = require('chai')

const authMiddleware = require('../middleware/auth');

it('Authorization header is present', function() {
	const req = {
		get() {
			return null;
		}
	};

	expect(authMiddleware.bind(this, req, {}, () => {})).to.throw('Not authenticated');
});