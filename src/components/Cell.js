import React, {Component} from 'react';

class Cell extends Component {
    constructor(props={}) {
        super(props);

    }

    setProperties(props = {}) {
        Object.assign(this.props, props);
    }

    getProperty(propKey) {
        return this.props[propKey];
    }

    removeProperty(properties = []) {
        for (let property of properties) {
            delete this.props[property];
        }
    }

    

    render() {
        return (
            <svg cellidx={this.props.cellidx} 
            onMouseUp={this.props.onMouseUp}
            onMouseOver={this.props.onMouseOver}
            onMouseDown={this.props.onMouseDown}
            style={{display: "inline"}, {verticalAlign: "top"}} 
            
            width={this.props.rect.w} 
            height={this.props.rect.h} 
            ref={(svg) => this.svg = svg}>
                <rect
                    x="0"
                    y="0"
                    width={this.props.rect.w}
                    height={this.props.rect.h}
                    stroke="black"
                    fill={this.props.cellColorFill}
                    strokeWidth='1'
                    ref={(e)=>this.svgRectEle = e}
                />
            </svg>
        );
    }

};

export default Cell;