#/bin/bash

aws s3 sync dist s3://network.shipchain.io --delete
aws cloudfront create-invalidation --distribution-id E1SK28RU9DKPUQ --paths '/*'