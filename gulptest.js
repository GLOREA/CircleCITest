'use strict';

exports.test = (event, context, callback) => {
	callback(null, 'OK', event);
};

// 失敗
process.exit(1);
