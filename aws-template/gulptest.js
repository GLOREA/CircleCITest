{
	"AWSTemplateFormatVersion": "2010-09-09",
	"Description": "Gulp Soil API Version 0.1",
	"Resources": {
		"LambdaRole": {
		    "Type": "AWS::IAM::Role",
		    "Properties": {
		        "AssumeRolePolicyDocument": {
		            "Version": "2012-10-17",
		            "Statement": [
		            	{
		                	"Effect": "Allow",
		                	"Principal": "lambda.amazonaws.com",
		                	"Action": ["sts:AssumeRole"]
		            	}
		            ]
		        },
		        "Path": "/",
		        "Policies": ['cp_iwai_s3_user-lambda-test-policy']
		    }
		},

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