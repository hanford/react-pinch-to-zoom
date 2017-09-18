import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import window from 'global/window'
import { Motion, spring } from 'react-motion'

import throttle from 'lodash.throttle'

export default class ReactPinchToZoom extends PureComponent {

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

  startX = 0
  startY = 0
  touching = false
  touches = 0

  state = {
    scale: this.props.initialScale,
    x: 0,
    y: 0,
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
    this.removeListeners()
  }

  componentDidMount () {
    this.resize()
    this.applyListeners()
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
    if (!hasTwoTouchPoints(event)) return

    event.stopPropagation()

    const { scale, x, y } = this.state

    if (this.touches === 0) {
      this.firstEvent = event

      this.startX = x
      this.startY = y
    }

    if (hasTwoTouchPoints(event) || isZoomed(scale)) {
      eventPreventDefault(event)
    }

    this.touching = true
    this.touches = getTouchCount(event)
  }

  onTouchMove = event => {
    if (this.touching || this.touches > 1) {
      event.stopPropagation()
    }

    const startPoint = normalizeTouch(this.firstEvent)
    const { size, scale, x, y } = this.state
    const { maxScale } = this.props

    const movePoint = normalizeTouch(event)
    let next = {}

    if (hasTwoTouchPoints(event)) {
      const scaleFactor = (isTouch() && event.scale) ? event.scale : (movePoint.x < (size.width / 2)) ? scale + ((translatePos(startPoint, size).x - translatePos(movePoint, size).x) / size.width) : scale + ((translatePos(movePoint, size).x - translatePos(startPoint, size).x) / size.width)
      const nextScale = between(1, maxScale, scaleFactor)

      next = {
        scale: nextScale,
        x: (nextScale < 1.01) ? 0 : x,
        y: (nextScale < 1.01) ? 0 : y
      }
    } else {
      let scaleFactorX = ((size.width * scale) - size.width) / (scale * 2)
      let scaleFactorY = ((size.height * scale) - size.height) / (scale * 2)

      next = {
        x: between(inverse(scaleFactorX), scaleFactorX, movePoint.x - startPoint.x + this.startX),
        y: between(inverse(scaleFactorY), scaleFactorY, movePoint.y - startPoint.y + this.startY)
      }
    }

    window.requestAnimationFrame(() => this.setState(next))
  }

  onTouchEnd = event => {
    this.touches = this.touches - 1

    if (this.touches === 0) {
      this.touching = false

      const next = {}

      next.scale = this.props.initialScale

      next.x = 0
      next.y = 0

      this.setState(next)
    }
  }

  render () {
    return (
      <div ref={root => { this.root = root }}>
        {this.props.render(this.state)}}
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

function getTouchCount (event) {
  if (isTouch()) {
    return event.touches.length
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
