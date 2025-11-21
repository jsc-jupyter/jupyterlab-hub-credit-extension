// CreditsView.tsx
import * as React from 'react';
import HomeIcon from '@mui/icons-material/Home';
import StopIcon from '@mui/icons-material/StopCircle';
import { PageConfig } from '@jupyterlab/coreutils';

export const CreditsView: React.FC = () => {
  const [credits, setCredits] = React.useState('');

  const hubServerUser = PageConfig.getOption('hubServerUser');
  const hubServerName = PageConfig.getOption('hubServerName');
  const hubPrefix = PageConfig.getOption('hubPrefix');
  React.useEffect(() => {
    const start = async () => {
      console.log(
        'hubServerUser:',
        hubServerUser,
        'hubServerName:',
        hubServerName,
        'hubPrefix:',
        hubPrefix
      );
      let evt: EventSource | null = null;
      // const token = PageConfig.getOption('token');
      if (hubServerName && hubServerUser) {
        evt = new EventSource(
          hubPrefix +
            'api/credits/sseserver/' +
            hubServerUser +
            '/' +
            hubServerName
        );
      } else if (hubServerUser) {
        evt = new EventSource(
          hubPrefix + 'api/credits/sseserver/' + hubServerUser
        );
      } else {
        return;
      }
      // Open SSE connection
      evt.onmessage = msg => {
        const data = JSON.parse(msg.data);
        console.log('Received SSE message:', data);
        let text = 'Credits: ' + data.balance + ' / ' + data.cap;
        if (data.project) {
          text +=
            ' ( ' +
            data.project.name +
            ': ' +
            data.project.balance +
            ' / ' +
            data.project.cap +
            ' )';
        }
        setCredits(text);
      };

      evt.onerror = err => {
        console.error('SSE connection error', err);
        setCredits('Unavailable (refresh website to retry)');
      };

      // Cleanup when component unmounts
      return () => {
        if (evt) {
          evt.close();
        }
      };
    };
    start();
  }, []);

  const homeClick = () => {
    window.open(hubPrefix + 'home', '_blank');
  };
  const stopClick = () => {
    const token = PageConfig.getOption('token');
    console.log(token);
    const url = hubServerName
      ? `${hubPrefix}api/credits/stopserver/${hubServerUser}/${hubServerName}`
      : `${hubPrefix}api/credits/stopserver/${hubServerUser}`;

    // Send DELETE request without waiting
    fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `token ${token}`
      },
      credentials: 'omit'
    }).catch(err => console.error('Failed to send stop request:', err));
    window.location.href = hubPrefix + 'home';
  };

  return (
    <div className="lm-Widget lm-MenuBar jp-scrollbar-tiny">
      {hubPrefix && hubServerUser && (
        <ul
          className="lm-MenuBar-content"
          role="menubar"
          style={{ display: 'flex', alignItems: 'center' }}
        >
          <HomeIcon
            onClick={homeClick}
            style={{
              marginLeft: '12px',
              marginRight: '6px',
              cursor: 'pointer',
              color: 'var(--jp-accept-color-normal, var(--jp-brand-color1))'
            }}
          />
          <StopIcon
            onClick={stopClick}
            style={{
              marginLeft: '12px',
              marginRight: '6px',
              cursor: 'pointer',
              color: 'var(--jp-warn-color-normal, var(--jp-error-color1))'
            }}
          />
          <div style={{ marginLeft: '20px' }}>{credits}</div>
        </ul>
      )}
    </div>
  );
};
