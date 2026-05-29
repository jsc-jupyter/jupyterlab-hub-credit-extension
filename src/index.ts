import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import HeaderComponent from './headercomponent';
import { RequestGetAPIToken } from './handler';

/**
 * Initialization data for the jupyterlab_hub_credit_extension extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab_hub_credit_extension:plugin',
  description:
    'A JupyterLab extension that shows the information delivered by the JupyterHub Credit Service.',
  autoStart: true,
  activate: async (app: JupyterFrontEnd) => {
    console.log(
      'JupyterLab extension jupyterlab_hub_credit_extension is activated!'
    );

    // Retrieve JupyterHubAPIToken from backend
    const apiToken = await RequestGetAPIToken();

    // Create the widget
    const widget = new HeaderComponent(apiToken);

    // Add the widget to the top area
    app.shell.add(widget, 'top', { rank: 100 });
  }
};

export default plugin;
