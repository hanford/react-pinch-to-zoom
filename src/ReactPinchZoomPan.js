import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import window from 'global/window'
import { Motion, spring } from 'react-motion'

import throttle from 'lodash.throttle'

export default class ReactPinchZoomPan extends PureComponent {

  static defaultProps = {
    initialScale: 1,
    maxScale: 4
  }

  static propTypes = {
    render: PropTypes.func,
    onPinchStart: PropTypes.func,
    onPinchStop: PropTypes.func,
    initialScale: PropTypes.number,
    maxScale: PropTypes.number
  }

  pinchSubscription = null

  state = {
    obj: {
      scale: this.props.initialScale,
      x: 0,
      y: 0
    },
    isPinching: false,
    isPanning: false,
    listeners: false
  }

  resize () {
    if (this.root) {
      this.setState({
        size: {
          width: this.root.offsetWidth,
          height: this.root.offsetHeight
        }
      })
    }
  }

  componentWillUnmount () {
    if (this.pinchSubscription) this.pinchSubscription = null

    this.removeListeners()
  }

  componentDidMount () {
    this.resize()
    this.resizeThrottled = throttle(() => this.resize(), 500)
  }

  applyListeners = () => {
    if (this.root && !this.state.listeners) {
      this.root.addEventListener('touchstart', this.onTouchStart)
      this.root.addEventListener('touchmove', this.onTouchMove)
      this.root.addEventListener('touchend', this.onTouchEnd)

      window.addEventListener('resize', this.resizeThrottled)

      this.setState({ listeners: true })
    }
  }

  removeListeners = () => {
    if (this.root && this.state.listeners) {
      this.root.removeEventListener('touchstart', this.onTouchStart)
      this.root.removeEventListener('touchmove', this.onTouchMove)
      this.root.removeEventListener('touchend', this.onTouchEnd)

      window.removeEventListener('resize', this.resizeThrottled)

      this.setState({ listeners: false })
    }
  }

  onTouchStart = event => {
    let startX = 0
    let startY = 0

    console.log('EVENT!', event)

    const {scale} = this.state.obj

    // record x,y when touch starts
    startX = this.state.obj.x
    startY = this.state.obj.y

    if (hasTwoTouchPoints(event) || isZoomed(scale)) {
      eventPreventDefault(event)
    }
  }

  onTouchMove = event => {
    const startPoint = normalizeTouch(event)
    const { size } = this.state

    const {scale, x, y} = this.state.obj
    const {maxScale} = this.props
    const movePoint = normalizeTouch(event)

    if (hasTwoTouchPoints(event)) {
      const scaleFactor = (isTouch() && event.scale) ? event.scale : (movePoint.x < (size.width / 2)) ? scale + ((translatePos(startPoint, size).x - translatePos(movePoint, size).x) / size.width) : scale + ((translatePos(movePoint, size).x - translatePos(startPoint, size).x) / size.width)
      const nextScale = between(1, maxScale, scaleFactor)
      return {
        scale: nextScale,
        x: (nextScale < 1.01) ? 0 : x,
        y: (nextScale < 1.01) ? 0 : y
      }
    } else {
      let scaleFactorX = ((size.width * scale) - size.width) / (scale * 2)
      let scaleFactorY = ((size.height * scale) - size.height) / (scale * 2)
      return {
        x: between(inverse(scaleFactorX), scaleFactorX, movePoint.x - startPoint.x + startX),
        y: between(inverse(scaleFactorY), scaleFactorY, movePoint.y - startPoint.y + startY)
      }
    }
  }

  onTouchEnd = event => {

  }

  // handlePinch () {
  //   const domNode = this.root
  //   const touchStart = Observable.fromEvent(domNode, 'touchstart')
  //   const touchMove = Observable.fromEvent(window, 'touchmove')
  //   const touchEnd = Observable.fromEvent(window, 'touchend')

  //   let startX = 0
  //   let startY = 0

  //   const pinch = touchStart
  //   .do((event) => {
  //     console.log('EVENT!', event)
  //     event.stopPropagation()
  //     const {scale} = this.state.obj
  //     // record x,y when touch starts
  //     startX = this.state.obj.x
  //     startY = this.state.obj.y

  //     // allow page scrolling - ignore events unless they are beginning pinch or have previously pinch zoomed
  //     if (hasTwoTouchPoints(event) || isZoomed(scale)) {
  //       eventPreventDefault(event)
  //     }
  //   })
  //   .mergeMap((md) => {
  //     const startPoint = normalizeTouch(md)
  //     const {size} = this.state

  //     return touchMove
  //     .map((mm) => {
  //       const startPoint = normalizeTouch(md)
  //       const {size} = this.state

  //       console.log(mm)
  //       const {scale, x, y} = this.state.obj
  //       const {maxScale} = this.props
  //       const movePoint = normalizeTouch(mm)

  //       if (hasTwoTouchPoints(mm)) {
  //         const scaleFactor = (isTouch() && mm.scale) ? mm.scale : (movePoint.x < (size.width / 2)) ? scale + ((translatePos(startPoint, size).x - translatePos(movePoint, size).x) / size.width) : scale + ((translatePos(movePoint, size).x - translatePos(startPoint, size).x) / size.width)
  //         const nextScale = between(1, maxScale, scaleFactor)
  //         return {
  //           scale: nextScale,
  //           x: (nextScale < 1.01) ? 0 : x,
  //           y: (nextScale < 1.01) ? 0 : y
  //         }
  //       } else {
  //         let scaleFactorX = ((size.width * scale) - size.width) / (scale * 2)
  //         let scaleFactorY = ((size.height * scale) - size.height) / (scale * 2)
  //         return {
  //           x: between(inverse(scaleFactorX), scaleFactorX, movePoint.x - startPoint.x + startX),
  //           y: between(inverse(scaleFactorY), scaleFactorY, movePoint.y - startPoint.y + startY)
  //         }
  //       }
  //     })
  //     .takeUntil(touchEnd)
  //   })

  //   this.pinchSubscription = pinch.subscribe((newObject) => {
  //     if (this.state.obj.scale !== newObject.scale) this.refreshPinchTimeoutTimer()

  //     window.requestAnimationFrame(() => {
  //       this.setState({
  //         obj: {
  //           ...this.state.obj,
  //           ...newObject
  //         }
  //       })
  //     })
  //   })
  // }

  refreshPinchTimeoutTimer () {
    if (this.pinchTimeoutTimer) clearTimeout(this.pinchTimeoutTimer)

    if (!this.state.isPinching) this.pinchStarted()

    this.pinchTimeoutTimer = setTimeout(() => this.pinchStopped(), 500)
  }

  pinchStopped () {
    this.setState({ isPinching: false }, () => {
      this.pinchTimeoutTimer = null
      this.props.onPinchStop && this.props.onPinchStop()
    })
  }

  pinchStarted () {
    this.setState({ isPinching: true }, () => {
      this.props.onPinchStart && this.props.onPinchStart()
    })
  }

  render () {
    const {scale, x, y} = this.state.obj

    return (
      <div ref={root => { this.root = root }}>
        <Motion style={{ scale: spring(scale), y: spring(y), x: spring(x) }}>
          {({ scale, y, x }) => this.props.render({ x, y, scale })}
        </Motion>
      </div>
    )
  }
}

function eventPreventDefault (event) {
  event.preventDefault()
}

function isTouch () {
  return (('ontouchstart' in window) ||
    (navigator.MaxTouchPoints > 0) ||
    (navigator.msMaxTouchPoints > 0))
}

function hasTwoTouchPoints (event) {
  if (isTouch()) {
    return event.touches && event.touches.length === 2
  }
}

function isZoomed (scale) {
  return scale > 1
}

function between (min, max, val) {
  return Math.min(max, Math.max(min, val))
}

function inverse (val) {
  return val * -1
}

function normalizeTouch (e) {
  const p = isTouch() ? e.touches[0] : e
  return {
    x: p.clientX,
    y: p.clientY
  }
}

function translatePos (point, size) {
  return {
    x: (point.x - (size.width / 2)),
    y: (point.y - (size.height / 2))
  }
}
