import React, {Component} from 'react';
import './App.css';
import { Grid, AStarManager } from './components/Library';

class App extends Component {
    constructor(props) {
        super(props);
        this.GRID = () => <Grid rows={20} cols={50} liftstate={this.getStateFromGrid}></Grid>;
        this.MANAGER = () => <AStarManager gridstate={this.state.grid}/>;

        this.state = {
            grid: null
        };

    }

    getStateFromGrid = (_gridstate) => {
        this.setState({
            grid: _gridstate
        });

    }

    runAstar = () => {
        this.refs.manager.run();
    }

    resetAstar = () => {
        this.refs.manager.reset();
    }


    render() {
        
        return (
            <React.Fragment>
                <div className="App">
                    <div>
                        <Grid rows={20} cols={50} liftstate={this.getStateFromGrid}></Grid>
                    </div>
                    <button onClick={this.runAstar}>RUN</button>
                    <button onClick={this.resetAstar}>RESET</button>
                    <div> <AStarManager gridstate={this.state.grid} ref="manager"/> </div>
                </div>   
            </React.Fragment>
            

        );
    }

};

export default App;