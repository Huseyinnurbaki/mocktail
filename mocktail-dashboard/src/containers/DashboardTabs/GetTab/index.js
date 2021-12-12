import React from 'react';
import PropTypes from 'prop-types';
import BaseTab from '../../../components/BaseTab';
import TipsNTricks from '../../../components/TipsNTricks';
import Get from './get';

function GetTab(props) {
  const { tip } = props;
  return (
    <BaseTab>
      <Get {...props} />
      <TipsNTricks tip={tip} />
    </BaseTab>
  );
}

export default GetTab;

GetTab.propTypes = {
  tip: PropTypes.string
};
