'use strict';

exports.config = {
  app_name: [process.env.NEW_RELIC_APP_NAME || 'tp-devops'],
  license_key: process.env.NEW_RELIC_LICENSE_KEY || '',
  logging: {
    level: process.env.NEW_RELIC_LOG_LEVEL || 'info',
  },
  allow_all_headers: true,
  distributed_tracing: {
    enabled: true,
  },
  application_logging: {
    forwarding: {
      enabled: true,
    },
  },
};
