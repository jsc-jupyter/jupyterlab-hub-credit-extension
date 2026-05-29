import * as React from 'react';
import { ReactWidget } from '@jupyterlab/apputils';
import { CreditsView } from './headerview';

export default class HeaderComponent extends ReactWidget {
  private _token: string;

  constructor(token: string) {
    super();
    this._token = token;
    this.addClass('jp-HeaderComponent');
    this.node.style.display = 'flex';
    this.node.style.alignItems = 'center';
    this.id = 'jupyterlab_hub_credit_extension:header-component';
  }

  render(): React.ReactElement {
    return <CreditsView token={this._token} />;
  }
}
