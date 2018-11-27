import React, { Component } from 'react';
import { compose } from 'recompose';

import { AuthUserContext, withAuthorization } from '../Session';
import { withFirebase } from '../Firebase';

class HomePage extends Component {
  constructor() {
    super();

    this.state = {
      userLoading: false,
      taskLoading: false,
      text: '',
      completed: false,
      starred: false,
      tasks: [],
      users: {},
    };
  }

  componentDidMount() {
    this.setState({
      userLoading: true,
      taskLoading: true,
    });

    this.props.firebase.users().on('value', snapshot => {
      this.setState(state => ({
        users: snapshot.val(),
        userLoading: false,
      }));
    });

    this.props.firebase
      .tasks()
      .orderByKey()
      .limitToLast(100)
      .on('child_added', snapshot => {
        const key = snapshot.key;
        this.setState(state => ({
          tasks: [{ key, ...snapshot.val() }, ...state.tasks],
          taskLoading: false,
        }));
      });
  }

  componentWillUnmount() {
    this.props.firebase.users().off();
    this.props.firebase.tasks().off();
  }

  onChangeText = event => {
    this.setState({ text: event.target.value });
  };

  onChangeCompleted = event => {
    this.setState({ completed: event.target.checked });
  };

  onChangeStarred = event => {
    this.setState({ starred: event.target.checked });
  };

  onSubmit = (event, authUser) => {
    const { text, completed, starred } = this.state;

    this.props.firebase.tasks().push({
      text,
      completed,
      starred,
      userId: authUser.uid,
    });

    this.setState({
      text: '',
      completed: false,
      starred: false,
    });

    event.preventDefault();
  };

  render() {
    const {
      tasks,
      users,
      text,
      completed,
      starred,
      userLoading,
      taskLoading,
    } = this.state;

    const loading = userLoading || taskLoading;

    return (
      <AuthUserContext.Consumer>
        {authUser => (
          <div>
            <h1>Home Page</h1>
            <p>
              The Home Page is accessible by every signed in user.
            </p>

            <form onSubmit={event => this.onSubmit(event, authUser)}>
              <div>
                <label>Complete:</label>
                <input
                  type="checkbox"
                  value={completed}
                  onChange={this.onChangeCompleted}
                />
              </div>
              <div>
                <label>Star:</label>
                <input
                  type="checkbox"
                  value={starred}
                  onChange={this.onChangeStarred}
                />
              </div>
              <div>
                <label>Task:</label>
                <input
                  type="text"
                  value={text}
                  onChange={this.onChangeText}
                />
              </div>
              <div>
                <button type="submit">Send</button>
              </div>
            </form>

            <hr />

            {loading && <div>Loading ...</div>}

            {!loading && (
              <TaskList
                tasks={tasks}
                users={users}
                firebase={this.props.firebase}
              />
            )}
          </div>
        )}
      </AuthUserContext.Consumer>
    );
  }
}

const TaskList = ({ tasks, users, firebase }) => (
  <ul>
    {tasks.map((task, key) => (
      <TaskItem
        key={key}
        task={task}
        user={users[task.userId]}
        firebase={firebase}
      />
    ))}
  </ul>
);

const TaskItem = ({ task, user, firebase }) => {
  const toggleCompleted = event => {
    firebase
      .task(task.key)
      .child('completed')
      .setValue(event.target.completed);
  };

  return (
    <li>
      <strong>{user.username}</strong>

      <div>
        <div>
          <label>Complete:</label>
          <input
            type="checkbox"
            value={task.completed}
            onChange={toggleCompleted}
          />
        </div>
        <div>
          [{task.completed ? 'Completed!' : 'Not completed.'}]
        </div>
        <div>[{task.starred ? 'Starred!' : 'Not starred.'}]</div>
        <div>*** TASK ***</div>
        <div>{task.text}</div>
        <div>************</div>
      </div>
    </li>
  );
};

const condition = authUser => !!authUser;

export default compose(
  withAuthorization(condition),
  withFirebase,
)(HomePage);
