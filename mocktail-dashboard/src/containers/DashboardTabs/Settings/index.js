/* eslint-disable no-debugger */
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import BaseTab from '../../../components/BaseTab';
import { Row } from 'react-bootstrap';
import { APP_VERSION } from '../../../utils/appVersion';
import { GITHUB_RELEASES } from '../../../utils/paths.js';

import { get } from '../../../utils/request';

function Settings() {
  const [latestVersion, setLatestVersion] = useState('x.x.x');

  useEffect(() => {
    async function getLatestGitHubReleaseVersion() {
      const versions = await get(GITHUB_RELEASES);
      setLatestVersion(versions?.[0]?.tag_name);
    }
    getLatestGitHubReleaseVersion();
  }, []);
  return (
    <BaseTab>
      <Row>
        <h3>Settings ⚙️</h3>
        <h5>Current Version {APP_VERSION}</h5>
        <h5>Latest Version {latestVersion}</h5>
      </Row>
    </BaseTab>
  );
}

export default Settings;

Settings.propTypes = {
  tip: PropTypes.string
};
