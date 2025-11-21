// CreditsView.tsx
import * as React from 'react';
import HomeIcon from '@mui/icons-material/Home';
import StopIcon from '@mui/icons-material/StopCircle';
import { PageConfig } from '@jupyterlab/coreutils';

export const CreditsView: React.FC = () => {
  const [credits, setCredits] = React.useState('');
  const [creditsServiceAvailable, setCreditsServiceAvailable] =
    React.useState(false);
  const [serverHasCredits, setServerHasCredits] = React.useState(true);

  let hubServerUser = PageConfig.getOption('hubServerUser2');
  if (hubServerUser === '') {
    hubServerUser = PageConfig.getOption('hubUser');
  }
  const hubServerName = PageConfig.getOption('hubServerName');
  const hubPrefix = PageConfig.getOption('hubPrefix');
  const token = PageConfig.getOption('token');

  React.useEffect(() => {
    if (!hubPrefix) {
      return;
    }
    const hubCreditsHealth = `${hubPrefix}api/credits/health`;
    fetch(hubCreditsHealth, {
      method: 'GET',
      headers: {
        Authorization: `token ${token}`
      },
      credentials: 'omit'
    })
      .then(response => {
        if (response.ok) {
          console.log('JupyterHub Credit Service is available.');
          setCreditsServiceAvailable(true);
        } else {
          setCreditsServiceAvailable(false);
        }
      })
      .catch(() => setCreditsServiceAvailable(false));
  }, []);

  React.useEffect(() => {
    const start = async () => {
      if (!creditsServiceAvailable || !serverHasCredits || !hubPrefix) {
        return;
      }
      let evt: EventSource | null = null;
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
        evt.close();
        setServerHasCredits(false);
      };

      // Cleanup when component unmounts
      return () => {
        if (evt) {
          evt.close();
        }
      };
    };
    start();
  }, [creditsServiceAvailable]);

  const homeClick = () => {
    window.open(hubPrefix + 'home', '_blank');
  };
  const stopClick = () => {
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
      {hubPrefix && (
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
          {creditsServiceAvailable && (
            <>
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
            </>
          )}
        </ul>
      )}
    </div>
  );
};
