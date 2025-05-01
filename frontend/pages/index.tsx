import React from 'react';
import { Provider } from 'react-redux';
import { store } from '../src/store/store';
import App from '../src/App';

const Home: React.FC = () => {
  return (
    <Provider store={store}>
      <App />
    </Provider>
  );
};

export default Home;
