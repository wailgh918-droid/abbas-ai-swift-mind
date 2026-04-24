import React, { useState, useEffect } from 'react';

const TodoApp = () => {
    const [tasks, setTasks] = useState([]);
    const [taskInput, setTaskInput] = useState('');

    useEffect(() => {
        const storedTasks = JSON.parse(localStorage.getItem('tasks')) || [];
        setTasks(storedTasks);
    }, []);

    useEffect(() => {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }, [tasks]);

    const addTask = () => {
        if (taskInput) {
            setTasks([...tasks, { id: Date.now(), text: taskInput, completed: false }]);
            setTaskInput('');
        }
    };

    const toggleCompletion = (id) => {
        setTasks(tasks.map(task => 
            task.id === id ? { ...task, completed: !task.completed } : task
        ));
    };

    const deleteTask = (id) => {
        setTasks(tasks.filter(task => task.id !== id));
    };

    return (
        <div style={{ maxWidth: '500px', margin: '0 auto', textAlign: 'center' }}>
            <h1>Todo List</h1>
            <input
                type="text"
                value={taskInput}
                onChange={(e) => setTaskInput(e.target.value)}
                placeholder="Add a new task..."
                style={{ padding: '10px', width: '80%', marginBottom: '10px' }}
            />
            <button onClick={addTask} style={{ padding: '10px', marginLeft: '5px' }}>Add Task</button>
            <ul style={{ listStyleType: 'none', padding: '0' }}>
                {tasks.map(task => (
                    <li key={task.id} style={{ display: 'flex', justifyContent: 'space-between', margin: '10px 0' }}>
                        <span
                            onClick={() => toggleCompletion(task.id)}
                            style={{ textDecoration: task.completed ? 'line-through' : 'none', cursor: 'pointer' }}>
                            {task.text}
                        </span>
                        <button onClick={() => deleteTask(task.id)} style={{ color: 'red' }}>X</button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default TodoApp;