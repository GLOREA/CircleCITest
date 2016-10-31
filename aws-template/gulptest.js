{
	"AWSTemplateFormatVersion": "2010-09-09",
	"Description": "Gulp Soil API Version 0.1",
	"Resources": {
		"UserLambdaGulpTest": {
			"Type": "AWS::Lambda::Function",
			"Properties": {
				"Code": {
					"S3Bucket": "com.yamaha.ses.soil.dev",
					"S3Key": "dest/lambda.zip"
				},
		        "Description": "A test function for gulp.",
		        "FunctionName": "gulpTest",
		        "Handler": "index.handler",
		        "Role": {
		        	"Fn::Join": [
		        		"", [
		        			"arn:aws:iam::",
		        			{ "Ref": "AWS::AccountId" },
		        			":role/SoilLambdaBasicExecutionRole"
		        		]
		        	]
		        },
		        "Runtime": "nodejs4.3"						
			}
		}
	}
}