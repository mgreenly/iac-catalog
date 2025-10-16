# Terraform Configuration for S3 Bucket
# Generated on: 2025-10-16T01:39:39.284Z
# Author: Jane Doe
# Version: 1.0.0
# Account: 123456789012
# Contact: devops@company.com

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  required_version = ">= 1.0"
}

provider "aws" {
  region = "us-west-2"

  default_tags {
    tags = {
      ManagedBy   = "Terraform"
      Account     = "123456789012"
      Author      = "Jane Doe"
      ContactEmail = "devops@company.com"
    }
  }
}

resource "aws_s3_bucket" "my_app_bucket" {
  bucket = "my-company-app-bucket-prod"

  tags = {
    Name        = "my-company-app-bucket-prod"
    Environment = "production"
    Owner       = "devops-team"
    Project     = "web-application"
    CostCenter  = "engineering"
    CreatedDate = "2024-01-15"
    Version     = "1.0.0"
  }
}

resource "aws_s3_bucket_versioning" "my_app_bucket_versioning" {
  bucket = aws_s3_bucket.my_app_bucket.id

  versioning_configuration {
    status = "Enabled"
  }
}

output "bucket_info" {
  description = "Complete bucket information"
  value = {
    bucket_id   = aws_s3_bucket.my_app_bucket.id
    bucket_arn  = aws_s3_bucket.my_app_bucket.arn
    region      = "us-west-2"
    account     = "123456789012"
    owner       = "devops-team"
    created_by  = "Jane Doe"
  }
}
