'use strict';

const AWS = require('aws-sdk');
const fs = require('fs');
const gulp = require('gulp');
const path = require('path');

const bucketName = process.env['AWS_S3_BUCKET'];
const gulpTempDir = process.env['GULP_TEMP_DIR'];
const stackName = process.env['AWS_CLOUD_FORMATION_STACK'];
const region = process.env['AWS_REGION'];

AWS.config.update({
	accessKeyId: process.env['AWS_S3_ACCESS_KEY_ID'],
	secretAccessKey: process.env['AWS_S3_SECRET_ACCESS_KEY']
});

gulp.task('testTask', (done)=> {
	console.log(process.env);
});

gulp.task('Archive', (done)=> {
	var archive = require('archiver').create('zip', {});

	fs.mkdir('./dest', '777', (err)=> {
		if(err){ ; } // エラーが出ても何もしない（ディレクトリが存在している場合もエラーになるので）

		var zipFile = fs.createWriteStream('./dest/lambda.zip');

		archive.pipe(zipFile);

		archive.bulk([
			{
				expand: true,
				cwd: './',
				src: [
					'*.js',
					'!gulpfile.js',
					'!amazon-cognito-js.js'
				],
				dest: './',
				dot: true
			},
			{
				expand: true,
				cwd: './node_modules/',
				src: ['**/*'],
				dest: './node_modules/',
				dot: true
			},
			{
				expand: true,
				cwd: './migrations/',
				src: ['**/*'],
				dest: './migrations/',
				dot: true
			}
		]);

		zipFile.on('close', function(){
			done();
		})

		// 圧縮実行
		archive.finalize();
	});
});

gulp.task('S3Upload', (done)=> {
	const q = require('q');
	var bucket = new AWS.S3({
		params: { Bucket: bucketName }
	});

    // UpLoadの部分は、プロミスを利用しての並行処理をする必要がある
	var s3Upload = (parentPath, basePath)=> {
		parentPath = parentPath || '/';
		basePath = basePath || __dirname;
		var d = q.defer();
		var promiseList = [];

		fs.readdirSync(path.join(basePath, parentPath)).forEach((file)=> {
			var filePath = path.join(parentPath, file)
			if(fs.statSync(filePath).isDirectory()){
				promiseList = promiseList.concat(s3Upload(filePath));
			}else{
				// アップロード処理

				bucket.putObject(
					{
						Key: path.join(gulpTempDir, filePath),
						Body: fs.readFileSync(path.join(basePath, filePath))
					},
					(err, data)=> {
						if(err){
							// TODO: 非同期でのエラー処理方法を考える
							throw err;
							d.resolve(err);
						}
				        d.resolve();
					}
				);
			}
		});
		promiseList.push(d.promise);
		return promiseList;
	};

	q.all(s3Upload('dest').concat(s3Upload('aws-template'))).then((data) =>{
		//
		done();
		return;
	}, (err)=> {
		// 異常終了
		console.log(err);
		process.exit(1);
	});
});

const modifyCloudFormationTemplate = (filePath)=> {
	var params = JSON.parse(fs.readFileSync(filePath, 'utf8'));

	var modifyParams = (params)=> {
		for(var key in params){
			if(!(params[key] instanceof Object) || params[key] instanceof Array){
				if(key =='Key' || key == 'S3Key'){
					params[key] = path.join(gulpTempDir, params[key]);
					continue;
				}
				if(key == 'Bucket' || key =='S3Bucket'){
					params[key] = bucketName;
					continue;
				}
			}else{
				params[key] = modifyParams(params[key]);
			}
		}
		return params;
	};
	params = modifyParams(params);

	return JSON.stringify(params);
};

gulp.task('CloudFormation', (done)=> {
	var cloudFormation = new AWS.CloudFormation({
		apiVersion: '2010-05-15',
		region: region
	});

	cloudFormation.deleteStack({ StackName: stackName }, (err, data)=> {
		if(err){ console.log(err); } // 特に処理は止めない

		return cloudFormation.createStack({
		// return cloudFormation.updateStack({
			StackName: stackName,
			// TODO: ローカルのテンプレートファイルを使う
			TemplateBody: modifyCloudFormationTemplate('aws-template/gulptest.js')
		}, (err, data)=> {
			if(err){
				console.log(err);
				process.exit(1);
				done();
			}
			done();
		});
	});
});
