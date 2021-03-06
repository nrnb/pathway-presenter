import React, { Component } from 'react';
import PropTypes from 'prop-types';
import EmptyState from './components/EmptyState';
import PreviewPanel from './components/PreviewPanel';
import EditorPanel from './components/EditorPanel';
import Paper from 'material-ui/Paper';
import FloatingActionButton from 'material-ui/FloatingActionButton';
import SettingsDialog from './components/SettingsDialog';
import ContentAdd from 'material-ui/svg-icons/content/add';
import { cloneDeep, isEqual } from 'lodash';
import Toolbar from './components/Toolbar';
import Slide from './components/Slide';
import Joyride from 'react-joyride';
import { setCookie, checkCookie } from '../../../../utils/cookies';
import 'react-joyride/lib/react-joyride-compiled.css';
import './index.css';

const onboardingCookieName = 'pathwayPresenterShownOnboarding';

class Creator extends Component {
  constructor(props) {
    super(props);
    const copy = cloneDeep(props.presentation);
    this.state = {
      activeSlideIndex: 0,
      selectedEntity: null,
      presentation: copy,
      settingsDialogOpen: false,
      hasSlideChanged: true,
      diagramLocked: !!(
        copy.slides[0].panCoordinates && copy.slides[0].zoomLevel
      )
    };

    window.onbeforeunload = this.beforeUnload;
  }

  beforeUnload = e => {
    if (!isEqual(this.props.presentation, this.state.presentation)) {
      const confirmationMessage =
        'Your presentation has unsaved changed! Are you sure you want to leave?';

      // Use both for cross browser
      // See: https://developer.mozilla.org/en-US/docs/Web/Events/beforeunload
      e.returnValue = confirmationMessage;
      return confirmationMessage;
    }
  };

  handlePreviewClick = slideIndex => {
    this.setState(state => {
      return {
        activeSlideIndex: slideIndex,
        selectedEntity: null,
        hasSlideChanged: state.activeSlideIndex !== slideIndex,
        diagramLocked: !!(
          state.presentation.slides[slideIndex].panCoordinates &&
          state.presentation.slides[slideIndex].zoomLevel
        )
      };
    });
  };

  handleEntityClick = entity => {
    // For now we only allow entities with text (nodes)
    if (!entity.textContent) return;
    this.setState({ selectedEntity: entity });
  };

  handleSingleSlideUpdate = slide => {
    const { activeSlideIndex } = this.state;
    this.setState(state => {
      let newSlides = state.presentation.slides.slice();
      newSlides[activeSlideIndex] = Object.assign(
        {},
        newSlides[activeSlideIndex],
        slide
      );
      return {
        presentation: Object.assign({}, state.presentation, {
          slides: newSlides
        }),
        selectedEntity: null,
        // This may seem counter-intuitive. The slide has changed because the in-state slide differs
        // from the in-props slide
        hasSlideChanged: true
      };
    });
  };

  handlePanZoomChanged = ({ x, y, zoomLevel }) => {
    // Use properties not state since there is no need for the component to re-render
    this.panCoordinates = { x, y };
    this.zoomLevel = zoomLevel;
  };

  handleLock = () => {
    this.setState(state => {
      const copy = cloneDeep(state.presentation);
      copy.slides[state.activeSlideIndex].panCoordinates = this.panCoordinates;
      copy.slides[state.activeSlideIndex].zoomLevel = this.zoomLevel;
      return {
        diagramLocked: true,
        presentation: copy
      };
    });
  };

  handleUnlock = () => {
    this.setState(state => {
      const copy = cloneDeep(state.presentation);
      copy.slides[state.activeSlideIndex].panCoordinates = null;
      copy.slides[state.activeSlideIndex].zoomLevel = null;
      return {
        presentation: copy,
        diagramLocked: false
      };
    });
  };

  onSlideAdd = () => {
    this.setState(state => {
      return {
        presentation: Object.assign({}, state.presentation, {
          slides: state.presentation.slides.concat({
            targets: [],
            title: null
          })
        }),
        // Since added one slide, new index is the length
        activeSlideIndex: state.presentation.slides.length,
        hasSlideChanged: true,
        selectedEntity: null
      };
    });
  };

  handleSlidesUpdate = ({ slides, newActiveIndex }) => {
    this.setState(state => {
      const copy = cloneDeep(state.presentation);
      copy.slides = slides;
      return {
        presentation: copy,
        selectedEntity: null,
        activeSlideIndex: newActiveIndex,
        hasSlideChanged: state.activeSlideIndex !== newActiveIndex
      };
    });
  };

  handleSave = () => {
    const { presentation } = this.state;
    const { handleSave } = this.props;
    handleSave(presentation);
  };

  handleSettingsClick = () => {
    this.setState({ settingsDialogOpen: true });
  };

  handleSettingsSave = ({ title, authorName, wpId, version }) => {
    const toUpdate = cloneDeep(this.state.presentation);
    const updated = Object.assign(toUpdate, {
      title,
      authorName,
      wpId,
      version
    });
    this.setState(
      {
        presentation: updated
      },
      this.handleSave
    );
  };

  handlePresentClick = () => {
    if (!isEqual(this.props.presentation, this.state.presentation)) {
      alert(
        'Unsaved changes! Save before presenting to present your latest changes.'
      );
      return;
    }
    const { presentation } = this.state;
    const href = `${window.location
      .href}?present=true&presId=${presentation.id}`;
    window.open(href, '_blank');
  };

  renderNonEmptyComps() {
    const {
      activeSlideIndex,
      selectedEntity,
      presentation,
      hasSlideChanged,
      diagramLocked
    } = this.state;
    if (presentation.slides.length < 1) return null;
    const slide = presentation.slides[activeSlideIndex];

    return (
      <span>
        <div className="left-section">
          <EditorPanel
            slide={slide}
            slideIndex={activeSlideIndex}
            activeEntity={selectedEntity}
            onUpdate={this.handleSingleSlideUpdate}
            hasSlideChanged={hasSlideChanged}
            handleCancelTarget={() => this.setState({ selectedEntity: null })}
            handleTargetChipClick={entity =>
              this.setState({ selectedEntity: entity })}
          />
        </div>
        <div className="right-section">
          <div className="previewer">
            <div className="slide-wrapper">
              <Slide
                slide={slide}
                wpId={presentation.wpId}
                version={presentation.version}
                handleEntityClick={this.handleEntityClick}
                diagramLocked={diagramLocked}
                handlePanZoomChanged={this.handlePanZoomChanged}
                handleLock={this.handleLock}
                handleUnlock={this.handleUnlock}
              />
            </div>
          </div>
          <Paper className="footer">
            <PreviewPanel
              slides={presentation.slides}
              wpId={presentation.wpId}
              version={presentation.version}
              onClick={this.handlePreviewClick}
              handleUpdate={this.handleSlidesUpdate}
              width={'calc(100% - 10rem)'}
              height="100%"
              activeSlideIndex={activeSlideIndex}
            />
            <FloatingActionButton
              id="add-slide-button"
              className="add-slide-button"
              onTouchTap={this.onSlideAdd}
            >
              <ContentAdd />
            </FloatingActionButton>
          </Paper>
        </div>
      </span>
    );
  }

  render() {
    const { presentation, settingsDialogOpen } = this.state;
    const { handleDelete } = this.props;

    const EmptyComps = () => {
      if (presentation.slides.length > 0) return null;
      return <EmptyState handleClick={this.onSlideAdd} />;
    };

    const joyrideSteps = [
      {
        title: 'Your slide',
        text:
          'This is a preview of how your slide will look when you present it.',
        selector: '#slide',
        trigger: '#slide'
      },
      {
        title: 'Position the diagram',
        text:
          "Drag the diagram and use the controls to position the diagram the way you'd like to present it.",
        selector: '#svg-pan-zoom-controls'
      },
      {
        title: 'Lock it',
        text: 'Lock the diagram in place to save the positioning.',
        selector: '#slide-lock'
      },
      {
        title: 'Highlight and hide',
        text:
          'Click on a node in the diagram to show the controls for highlighting and hiding.',
        name: 'diagram-click',
        selector: '.diagram-wrapper'
      },
      {
        title: 'Add a title',
        selector: '#editor-title-field'
      },
      {
        title: 'Add a new slide',
        selector: '#add-slide-button'
      },
      {
        title: 'Reorder slides',
        text: 'You can reorder the slides simply by dragging them.',
        selector: '.preview-panel'
      },
      {
        title: 'Save your work!',
        selector: '#save-button'
      },
      {
        title: 'Show the audience',
        text: "Once you're happy, hit present to show an audience",
        selector: '#present-button'
      }
    ];

    const joyrideCallback = ({ type }) => {
      if (type === 'finished') {
        setCookie(onboardingCookieName);
      }
    };
    const shouldShowJoyride = checkCookie(onboardingCookieName);
    return (
      <div className="creator-wrapper">
        <Joyride
          ref="joyride"
          steps={joyrideSteps}
          run={shouldShowJoyride}
          showSkipButton={true}
          autoStart={true}
          type="continuous"
          callback={joyrideCallback}
        />
        <Toolbar
          authorName={presentation.authorName}
          title={presentation.title}
          handleSave={this.handleSave}
          handlePresentClick={this.handlePresentClick}
          handleSettingsClick={this.handleSettingsClick}
        />
        <SettingsDialog
          handleDelete={handleDelete}
          isOpen={settingsDialogOpen}
          handleClose={() => this.setState({ settingsDialogOpen: false })}
          handleSave={this.handleSettingsSave}
          version={presentation.version}
          wpId={presentation.wpId}
          authorName={presentation.authorName}
          title={presentation.title}
        />
        <EmptyComps />
        {this.renderNonEmptyComps()}
      </div>
    );
  }
}

Creator.propTypes = {
  presentation: PropTypes.object.isRequired,
  handleSave: PropTypes.func.isRequired,
  handleDelete: PropTypes.func.isRequired
};

export default Creator;
