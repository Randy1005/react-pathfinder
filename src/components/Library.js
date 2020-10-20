import React, {Component} from 'react'
import Cell from './Cell';

export class Grid extends Component {
    constructor(props) {
        super(props);
        this.rowIndices = Array.from(Array(this.props.rows).keys());
        this.colIndices = Array.from(Array(this.props.cols).keys());

        let numCells = this.props.rows * this.props.cols;
        this.cells = Array(numCells);
        for (var i = 0; i < numCells; i++) {
            this.cells[i] = new Cell();
        }

        this.mouseAction = null;
        this.state = {
            cells: this.cells,
            grid: this
        };



        // assign start position and destination
        this.cells[0].setProperties({'startPosition': true});
        this.cells[945].setProperties({'destination': true});

        
        this.handleDataUpdate = this.handleDataUpdate.bind(this);
        this.liftStateToApp();
    }

    liftStateToApp = () => {
        this.props.liftstate(this.state);
    }

    handleDataUpdate() {
        this.setState({
            cells: this.cells,
            grid: this
        });

        this.liftStateToApp();
    }


    getCellIdx(property) {
        for (var i in this.cells) {
            if (this.cells[i].getProperty(property)) {
                return parseInt(i, 10);
            }
        }
    }

    removeFromCells(property) {
        for (let i in this.cells) {
            if (this.cells[i].props[property]) {
                this.cells[i].removeProperty([property]);
            } 
        }
    }

    mouseEvent(cellIdx, event) {
        if (event.type === 'mouseup') {
            this.mouseAction = null;
            this.cells[cellIdx].removeProperty(['active']);
  
            return;
        }
        
        // not holding down, ignore mouse over for this case
        if (event.buttons !== 1 && event.type !== 'click') {
            this.mouseAction = null;
            
            return;
        }


        if (this.mouseAction == null) {
            if (this.cells[cellIdx].getProperty('startPosition')) {
                this.mouseAction = (cellIdx) =>  {
                    this.removeFromCells('startPosition');
                    this.cells[cellIdx].setProperties({'startPosition': true});   
                }
            } else if (this.cells[cellIdx].getProperty('destination')) {
                this.mouseAction = (cellIdx) => {
                    this.removeFromCells('destination');
                    this.cells[cellIdx].setProperties({'destination': true});
                }
            } else if (this.cells[cellIdx].getProperty('wall')) {
                this.mouseAction = (cellIdx) => {
                    this.cells[cellIdx].removeProperty(['wall']);
                }
            } else {
                this.mouseAction = (cellIdx) => {
                    this.cells[cellIdx].setProperties({'wall': true});
                }
            }
        }

             
        this.handleDataUpdate();

        this.cells[cellIdx].setProperties({ 'active': true });
        this.mouseAction(cellIdx);
    }

    getNeighborCellIdx(cellIdx, direction) {
        let neighborCellIdx;

        switch (direction) {
            case "LEFT":
                neighborCellIdx = cellIdx - 1;
                if ((neighborCellIdx+1) % this.colIndices.length === 0) {
                    // on the left edge
                    return null;
                }
                break;
            case "UP":
                neighborCellIdx = cellIdx - this.colIndices.length;
                break;
            case "RIGHT":
                neighborCellIdx = cellIdx + 1;
                if (neighborCellIdx % this.colIndices.length === 0) {
                    // on the right edge
                    return null;
                }
                break;
            case "DOWN":
                neighborCellIdx = cellIdx + this.colIndices.length;
                break;
            default:
                neighborCellIdx = null;
            
        
        }

        if (neighborCellIdx < 0 || neighborCellIdx >= this.props.rows * this.props.cols)
            return null;

        return neighborCellIdx;
    }

    heuristicDistance(cellAIdx, cellBIdx) {
        let horizontalDist = Math.abs(Math.floor(cellAIdx / this.colIndices.length) - Math.floor(cellBIdx / this.colIndices.length));
        let verticalDist = Math.abs((cellAIdx % this.colIndices.length) - (cellBIdx % this.colIndices.length));
        return horizontalDist + verticalDist;
    }


    


    render() {
        return (
        
            <div className='grid'>
            {
                this.rowIndices.map((row)=>{
                    return (
                        <div key={row} className='gridRow'>
                        {
                            this.colIndices.map((col)=>{
                                let cellIndex = row * this.colIndices.length + col;

                                let cellColorFill = 
                                this.cells[cellIndex].getProperty('startPosition') ? "blue" :
                                this.cells[cellIndex].getProperty('destination') ? "red" : 
                                this.cells[cellIndex].getProperty('wall') ? "black" :
                                this.cells[cellIndex].getProperty('path') ? "grey":
                                "none";

                                return (
                                <Cell
                                    cellColorFill={cellColorFill}
                                    onMouseDown={this.mouseEvent.bind(this, cellIndex)}
                                    onMouseOver={this.mouseEvent.bind(this, cellIndex)}
                                    onMouseUp={this.mouseEvent.bind(this, cellIndex)}
                                    key={`#cellIdx${cellIndex}`}
                                    cellidx={row * this.colIndices.length + col}
                                    rect={{w: 30, h: 30}}>
                                </Cell>)
                            })
                        }
                        </div>
                    )
                })
            }
            </div>
        )
    }
};

export class AStarManager extends Component {
    constructor(props) {
        super(props);
    }

    reset() {
        this.currCellIdx = null;
        this.destinationCellIdx = null;
        this.openList = [];
        this.closedList = [];
        this.cellFGHValues = {};

        this.props.gridstate.grid.removeFromCells(['path']);
        this.props.gridstate.grid.removeFromCells(['wall']);

        this.props.gridstate.grid.handleDataUpdate();
        this.unReachable = false;

    }

    init() {
        // openList empty
        // closed list containing only start cell
        this.currCellIdx = this.props.gridstate.grid.getCellIdx('startPosition');
        this.destinationCellIdx = this.props.gridstate.grid.getCellIdx('destination');
        this.closedList = [this.currCellIdx];
        this.cellFGHValues = {
            [this.currCellIdx]: {
                g: 0,
                f: this.props.gridstate.grid.heuristicDistance(this.currCellIdx, this.destinationCellIdx)
            }
        };

        this.path = [];
        this.openList = [];
        this.unReachable = false;
    }

    run() {
        this.init();
        while (this.currCellIdx !== this.destinationCellIdx) {
            if (this.unReachable) {
                alert("Destination Not Reachable.");
                break;
            }

            this.step();
        }

        // search ended, get the path
        if (this.currCellIdx != null) {
            let pathCell = this.currCellIdx;
            while (this.cellFGHValues[pathCell].from) {
                pathCell = this.cellFGHValues[pathCell].from;
                this.path.push(pathCell);
                this.props.gridstate.grid.cells[pathCell].setProperties({'path': true});
            }
        }

        this.props.gridstate.grid.handleDataUpdate();


    }

    step() {
        let neighborDirections = ['LEFT', 'UP', 'RIGHT', 'DOWN'];
        
        neighborDirections.forEach((dir) => {
            let neighborCellIdx = this.props.gridstate.grid.getNeighborCellIdx(this.currCellIdx, dir);

            if (neighborCellIdx == null || this.props.gridstate.cells[neighborCellIdx].getProperty('wall')) {
                return;
            }

            // not yet visited
            if (this.closedList.indexOf(neighborCellIdx) === -1) {
                // add to openList first
                if (this.openList.indexOf(neighborCellIdx) === -1) {
                    this.openList.push(neighborCellIdx);
                }

                // calculate F, G values
                let neighborCellG = this.cellFGHValues[this.currCellIdx].g + 1;
                let neighborCellF = this.props.gridstate.grid.heuristicDistance(neighborCellIdx, this.destinationCellIdx) + neighborCellG;

                // update F, G values
                if (this.cellFGHValues[neighborCellIdx] === undefined || neighborCellG < this.cellFGHValues[neighborCellIdx].g) {
                    this.cellFGHValues[neighborCellIdx] = {
                        g: neighborCellG,
                        f: neighborCellF,
                        from: this.currCellIdx
                    };
                }
            }

        }); 

        let lowestCostNeighbor = null;
        for (let i in this.openList) {
            let openCell = this.openList[i];
            if (lowestCostNeighbor == null || this.cellFGHValues[openCell].f < this.cellFGHValues[lowestCostNeighbor].f) {
                lowestCostNeighbor = openCell;
            }
        }

        this.currCellIdx = lowestCostNeighbor;
        // finished with this cell, push to closedlist, exclude from openlist
        this.closedList.push(this.currCellIdx);
        let opListIdx = this.openList.indexOf(this.currCellIdx);
        this.openList.splice(opListIdx, 1);

        if (this.openList.length === 0)
            this.unReachable = true;
            
    }


    render() {
        return null;
    }

};
