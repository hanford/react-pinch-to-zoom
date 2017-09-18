import React, {Component} from 'react'
import PropTypes from 'prop-types'
import s from 'react-prefixr'
import { ReactPinchZoomPan } from './'

class Pinch extends Component {
  getContainerStyle () {
    const {backgroundColor, containerRatio} = this.props

    return {
      paddingTop: containerRatio.toFixed(2) + '%',
      position: 'relative',
      background: backgroundColor
    }
  }

  getInnerStyle () {
    return {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0
    }
  }

  getHolderStyle () {
    return {
      position: 'relative'
    }
  }

  getContentStyle (pos) {
    return {
      width: '100%',
      height: '100%',
      align: 'center',
      display: 'flex',
      alignItems: 'center',
      transform: `scale(${pos.scale}) translateY(${pos.y}px)translateX(${pos.x}px)`,
      transition: '.3s ease-out'
    }
  }

  renderDebug (pos) {
    return (
      <div style={{position: 'absolute', bottom: 0, left: 0, background: '#555', color: '#fff', padding: '3px 6px'}}>
        Scale: {pos.scale}, X: {pos.x}, Y: {pos.y}
      </div>
    )
  }

  render () {
    const {debug, initialScale, maxScale, holderClassName, containerClassName, children, onPinchStart, onPinchStop} = this.props
    return (
      <ReactPinchZoomPan initialScale={initialScale} maxScale={maxScale} render={(pos) => {
        return (
          <div style={this.getHolderStyle()} className={holderClassName}>
            <div style={this.getContainerStyle()} className={containerClassName}>
              <div style={this.getInnerStyle()}>
                <div style={s(this.getContentStyle(pos))}>
                  {children}
                </div>
              </div>
            </div>
            {debug && this.renderDebug(pos)}
          </div>
        )
      }} onPinchStart={onPinchStart} onPinchStop={onPinchStop} />
    )
  }
}

Pinch.defaultProps = {
  initialScale: 1,
  maxScale: 2,
  containerRatio: 100,
  backgroundColor: '#fff',
  debug: false
}

Pinch.propTypes = {
  containerRatio: PropTypes.number,
  initialScale: PropTypes.number,
  maxScale: PropTypes.number,
  children: PropTypes.element,
  containerClassName: PropTypes.string,
  holderClassName: PropTypes.string,
  backgroundColor: PropTypes.string,
  debug: PropTypes.bool,
  onPinchStart: PropTypes.func,
  onPinchStop: PropTypes.func
}

export default Pinch
