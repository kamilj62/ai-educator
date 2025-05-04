import React from 'react';
import { Provider } from 'react-redux';
import { store } from '../src/store/store';
import App from '../src/App';
import LogViewer from '../src/components/LogViewer';

const Home: React.FC = () => {
  return (
    <Provider store={store}>
      <main>
        <App />
        {/* <LogViewer /> */}
      </main>
    </Provider>
  );
};

export default Home;
