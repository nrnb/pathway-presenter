import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './index.css';
import Paper from 'material-ui/Paper';
import { List, ListItem } from 'material-ui/List';
import { RadioButton, RadioButtonGroup } from 'material-ui/RadioButton';
import TextField from 'material-ui/TextField';
import ContentCircleOutline from 'material-ui/svg-icons/content/add-circle-outline';
import FlatButton from 'material-ui/FlatButton';
import IconButton from 'material-ui/IconButton';
import Toggle from 'material-ui/Toggle';
import Divider from 'material-ui/Divider';
import Chip from 'material-ui/Chip';
import Snackbar from 'material-ui/Snackbar';
import { sortBy, isEqual } from 'lodash';
import Subheader from 'material-ui/Subheader';
import addAction from '../../../../../../assets/add-action.svg';
import { Scrollbars } from 'react-custom-scrollbars';

class EditorPanel extends Component {
  constructor(props) {
    super(props);
    this.state = this.getInitialState(props);
  }

  componentWillReceiveProps(nextProps) {
    this.setState(this.getInitialState(nextProps));

    const { activeEntity, slide } = nextProps;
    if (!isEqual(this.props.activeEntity, activeEntity) && activeEntity) {
      const activeTarget = slide.targets.find(
        singleTarget => singleTarget.entityId === activeEntity.id
      );
      if (!activeTarget) {
        this.setState({
          isHighlighted: false,
          isPanned: false,
          isHidden: false,
          isZoomed: false,
          highlightedColor: null
        });
      } else {
        this.setState({
          isHighlighted: activeTarget.highlighted,
          isPanned: activeTarget.panned,
          isHidden: activeTarget.hidden,
          isZoomed: activeTarget.zoomed,
          highlightedColor: activeTarget.highlightedColor
        });
      }
    }
  }

  getInitialState(props) {
    return {
      isHighlighted: false,
      isPanned: false,
      isHidden: false,
      isZoomed: false,
      highlightedColor: null,
      targets: props.slide.targets || [],
      title: props.slide.title || '',
      id: props.slide.id,
      isDuplicate: false,
      canSlideUpdate: !props.hasSlideChanged
    };
  }

  handleHighlightToggle = () => {
    this.setState(state => {
      return {
        isHighlighted: !state.isHighlighted
      };
    });
  };

  handleZoomToggle = () => {
    this.setState(state => {
      return {
        isZoomed: !state.isZoomed
      };
    });
  };

  handlePanToggle = () => {
    this.setState(state => {
      return {
        isPanned: !state.isPanned
      };
    });
  };

  handleHiddenToggle = () => {
    this.setState(state => {
      return {
        isHidden: !state.isHidden
      };
    });
  };

  handleColorChange = (e, value) => {
    this.setState({
      highlightedColor: value
    });
  };

  handleAdd = () => {
    this.setState((state, props) => {
      // Filter out the new target and add it again
      // Allows for editing of already added targets
      const newTargets = state.targets.filter(
        singleTarget => singleTarget.entityId !== props.activeEntity.id
      );
      return {
        targets: newTargets.concat([
          {
            entityId: props.activeEntity.id,
            fullEntity: props.activeEntity,
            hidden: state.isHidden,
            zoomed: state.isZoomed,
            panned: state.isPanned,
            highlighted: state.isHighlighted,
            highlightedColor: state.highlightedColor
          }
        ]),
        canSlideUpdate: true
      };
    });
  };

  handleRequestChipDelete = entityId => {
    this.setState(state => {
      return {
        targets: state.targets.filter(
          singleTarget => singleTarget.entityId !== entityId
        ),
        canSlideUpdate: true
      };
    });
  };

  handleSnackbarRequestClose = () => {
    this.setState({
      isDuplicate: false
    });
  };

  handleTitleChange = e => {
    const val = e.target.value;
    this.setState({
      title: val || '',
      canSlideUpdate: true
    });
  };

  componentDidUpdate(prevProps, prevState) {
    const { title, targets, canSlideUpdate } = this.state;
    const { onUpdate } = this.props;
    if (!onUpdate) return;
    if (canSlideUpdate) {
      onUpdate({
        title,
        targets
      });
    }
  }

  renderTargetControls() {
    const { activeEntity, handleCancelTarget } = this.props;
    if (!activeEntity) return null;

    return (
      <div className="controls">
        <List>
          <Subheader>
            Add action to "{activeEntity.textContent}"
          </Subheader>
          <ListItem
            primaryText="Zoom"
            rightToggle={
              <Toggle
                onToggle={this.handleZoomToggle}
                toggled={this.state.isZoomed}
              />
            }
          />
          <Divider />
          <ListItem
            primaryText="Pan"
            rightToggle={
              <Toggle
                onToggle={this.handlePanToggle}
                toggled={this.state.isPanned}
              />
            }
          />
          <Divider />
          <ListItem
            primaryText="Hide"
            rightToggle={
              <Toggle
                onToggle={this.handleHiddenToggle}
                toggled={this.state.isHidden}
              />
            }
          />
          <Divider />
          <ListItem
            primaryText="Highlight"
            rightToggle={
              <Toggle
                onToggle={this.handleHighlightToggle}
                toggled={this.state.isHighlighted}
              />
            }
            open={this.state.isHighlighted}
            nestedItems={[
              <RadioButtonGroup
                name="highlightColor"
                defaultSelected="red"
                className="color-options"
                onChange={this.handleColorChange}
                valueSelected={this.state.highlightedColor}
                key={1}
              >
                <RadioButton
                  value="red"
                  label="Red"
                  className="color-choice"
                  key={1}
                />
                <RadioButton
                  value="green"
                  label="Green"
                  className="color-choice"
                  key={2}
                />
                <RadioButton
                  value="blue"
                  label="Blue"
                  className="color-choice"
                  key={3}
                />
                <RadioButton
                  value="yellow"
                  label="Yellow"
                  className="color-choice"
                  key={4}
                />
              </RadioButtonGroup>
            ]}
          />
          <Divider />
        </List>
        <FlatButton
          className="cancel-target-button"
          label="Cancel"
          onClick={handleCancelTarget}
        />
        <FlatButton
          className="add-target-button"
          label="Done"
          onClick={this.handleAdd}
        />
        <Snackbar
          open={this.state.isDuplicate}
          message="No duplicate entities!"
          autoHideDuration={3000}
          onRequestClose={this.handleSnackbarRequestClose}
        />
      </div>
    );
  }

  renderTargetEmptyState() {
    const { activeEntity } = this.props;
    if (activeEntity) return null;
    return (
      <div className="empty-state">
        <img src={addAction} />
        <h1>Select a node!</h1>
        <p>Click on a node in the diagram to add an action.</p>
      </div>
    );
  }

  renderTargetChips() {
    const { targets } = this.state;
    const { handleTargetChipClick } = this.props;
    const chips = targets.map((singleTarget, i) =>
      <Chip
        key={i}
        className="target-chip"
        onClick={() => handleTargetChipClick(singleTarget.fullEntity)}
        onRequestDelete={() =>
          this.handleRequestChipDelete(singleTarget.entityId)}
      >
        {singleTarget.fullEntity.textContent}
      </Chip>
    );

    if (chips.length < 1) return null;
    return (
      <div className="chip-wrapper">
        {chips}
      </div>
    );
  }

  render() {
    return (
      <Paper className="editor-panel-container">
        <Scrollbars>
          <TextField
            hintText="The Warburg Effect"
            floatingLabelText="Slide title"
            fullWidth={true}
            className="title-input"
            onChange={this.handleTitleChange}
            value={this.state.title}
          />
          {this.renderTargetEmptyState()}
          {this.renderTargetControls()}
          {this.renderTargetChips()}
        </Scrollbars>
      </Paper>
    );
  }
}

EditorPanel.propTypes = {
  activeEntity: PropTypes.object,
  onUpdate: PropTypes.func,
  slide: PropTypes.object.isRequired,
  handleCancelTarget: PropTypes.func.isRequired,
  handleTargetChipClick: PropTypes.func.isRequired,
  hasSlideChanged: PropTypes.bool.isRequired // Used to determine whether to call onUpdate
};

export default EditorPanel;
