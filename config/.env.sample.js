const envBuild = {
  'server': [
    'PORT=1337'
  ],
  'client': [
    'NODE_ENV=DEVELOPMENT',
    'DEBUG=TRUE',
    'ENVPREFIX=REACT_APP_',
    'REST_SERVER_URL=http://52.53.213.77:4990',
    'SOCKET_SERVER_URL=http://52.53.213.77:4155',
    'CODERUNNER_SERVICE_URL=http://52.53.213.77:4000',
    'REACT_APP_SOCKET_SERVER_URL=http://52.53.213.77:4155',
    'REACT_APP_REST_SERVER_URL=http://52.53.213.77:4990'
  ]
};

module.exports = envBuild;
