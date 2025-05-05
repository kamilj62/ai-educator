import React from 'react';
import { Provider } from 'react-redux';
import { store } from '../src/store/store';
import App from '../src/App';

const AppPage: React.FC = () => (
  <Provider store={store}>
    <App />
  </Provider>
);

export default AppPage;
