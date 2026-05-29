// CreditsView.tsx
import * as React from 'react';
import { Dialog, showDialog } from '@jupyterlab/apputils';
import Tooltip from '@mui/material/Tooltip';
import HomeIcon from '@mui/icons-material/Home';
import StopIcon from '@mui/icons-material/StopCircle';
import { PageConfig } from '@jupyterlab/coreutils';

export function showQuickPopup(message: string, closeTab: boolean = false) {
  const hubPrefix = PageConfig.getOption('hubPrefix');
  const quickPopupOKClick = () => {
    if (closeTab) {
      window.close();
    } else {
      window.location.href = hubPrefix + 'home';
    }
  };
  if (message === '') {
    if (closeTab) {
      message = 'You can close this tab.';
    } else {
      message =
        'Click OK to return to the JupyterHub home page, or close this tab manually.';
    }
  }
  const body = (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        whiteSpace: 'pre-line'
      }}
    >
      <span>{message}</span>
    </div>
  );
  showDialog({
    title: 'Jupyter Server Stopped',
    body,
    buttons: [Dialog.okButton({ label: 'OK' })]
  }).then(result => {
    if (result.button.accept) {
      quickPopupOKClick();
    }
  });
}

export const CreditsView: React.FC<{ token: string }> = ({ token }) => {
  const [credits, setCredits] = React.useState('');
  const [creditsServiceAvailable, setCreditsServiceAvailable] =
    React.useState(false);
  const [serverHasCredits, setServerHasCredits] = React.useState(true);
  const [showHomeIcon, setShowHomeIcon] = React.useState(true);

  let hubServerUser = PageConfig.getOption('hubServerUser2');
  if (hubServerUser === '') {
    hubServerUser = PageConfig.getOption('hubUser');
  }
  const hubServerName = PageConfig.getOption('hubServerName');
  const hubPrefix = PageConfig.getOption('hubPrefix');
  const hubToken = token === '' ? PageConfig.getOption('token') : token;

  React.useEffect(() => {
    if (!hubPrefix) {
      return;
    }
    const hubCreditsHealth = `${hubPrefix}api/credits/health`;
    fetch(hubCreditsHealth, {
      method: 'GET',
      headers: {
        Authorization: `token ${hubToken}`
      },
      credentials: 'omit'
    })
      .then(response => {
        if (response.ok) {
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
      let evtUrl: string = '';
      let retried = false;
      if (hubServerName && hubServerUser) {
        evtUrl =
          hubPrefix +
          'api/credits/sseserver/' +
          hubServerUser +
          '/' +
          hubServerName;
      } else if (hubServerUser) {
        evtUrl = hubPrefix + 'api/credits/sseserver/' + hubServerUser;
      } else {
        return;
      }
      evt = new EventSource(evtUrl);

      const onMessage = (msg: any) => {
        const data = JSON.parse(msg.data);
        if (data.error) {
          showQuickPopup(data.error);
          setServerHasCredits(false);
          return;
        }
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

      const onError = (err: any) => {
        if (!retried) {
          // Retry once with token in query params
          console.log('SSE error, retrying with token in query params.');
          retried = true;
          setShowHomeIcon(false);
          evt?.close();
          evtUrl += '?token=' + encodeURIComponent(hubToken);
          evt = new EventSource(evtUrl);
          evt.onmessage = msg => {
            onMessage(msg);
          };
          evt.onerror = onError;
        } else {
          console.error('SSE error:', err);
          evt?.close();
          setServerHasCredits(false);
        }
      };

      evt.onmessage = msg => {
        onMessage(msg);
      };

      evt.onerror = err => {
        onError(err);
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
        Authorization: `token ${hubToken}`
      },
      credentials: 'omit'
    }).catch(err => console.error('Failed to send stop request:', err));
    showQuickPopup('', !showHomeIcon);
  };

  return (
    <div className="lm-Widget lm-MenuBar jp-scrollbar-tiny">
      {hubPrefix && (
        <ul
          className="lm-MenuBar-content"
          role="menubar"
          style={{ display: 'flex', alignItems: 'center' }}
        >
          {showHomeIcon && (
            <Tooltip title="Open JupyterHub Home Page">
              <HomeIcon
                onClick={homeClick}
                style={{
                  marginLeft: '12px',
                  marginRight: '6px',
                  cursor: 'pointer',
                  color: 'var(--jp-accept-color-normal, var(--jp-brand-color1))'
                }}
              />
            </Tooltip>
          )}
          {creditsServiceAvailable && (
            <>
              <Tooltip title="Stop JupyterLab Server">
                <StopIcon
                  onClick={stopClick}
                  style={{
                    marginLeft: '12px',
                    marginRight: '6px',
                    cursor: 'pointer',
                    color: 'var(--jp-warn-color-normal, var(--jp-error-color1))'
                  }}
                />
              </Tooltip>
              <Tooltip title="Your current credit balance and cap. Click the stop icon to stop your server and save credits. If there are no credits left, your server will be stopped automatically.">
                <div style={{ marginLeft: '20px' }}>{credits}</div>
              </Tooltip>
            </>
          )}
        </ul>
      )}
    </div>
  );
};
