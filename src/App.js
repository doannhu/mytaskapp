import React, { useState, useEffect } from "react";
import "./App.css";
import "@aws-amplify/ui-react/styles.css";
import { API, Storage } from "aws-amplify";
import {
  Button,
  Flex,
  Heading,
  Image,
  Text,
  TextField,
  View,
  withAuthenticator,
} from "@aws-amplify/ui-react";
import { listTasks } from "./graphql/queries";
import {
  createTask as createTaskMutation,
  deleteTask as deleteTaskMutation,
} from "./graphql/mutations";

const App = ({ signOut }) => {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    fetchTasks();
  }, []);

  async function fetchTasks() {
    const apiData = await API.graphql({ query: listTasks });
    const tasksFromAPI = apiData.data.listTasks.items;
    await Promise.all(
      tasksFromAPI.map(async(task) =>{
        if (task.image) {
          const url = await Storage.get(task.name);
          task.image = url;
          console.log(task.image);
        }
      })
    )
    setTasks(tasksFromAPI);
  }

  async function createTask(event) {
    event.preventDefault();
    const form = new FormData(event.target);
    const image = form.get("image");
    const data = {
      name: form.get("name"),
      description: form.get("description"),
      image: image.name,
    };
    if (!!data.image) await Storage.put(data.name, image);
    await API.graphql({
      query: createTaskMutation,
      variables: { input: data },
    });
    fetchTasks();
    event.target.reset();
  }

  async function deleteTask({ id, name }) {
    const newTaks = tasks.filter((task) => task.id !== id);
    setTasks(newTaks);
    await Storage.remove(name);
    await API.graphql({
      query: deleteTaskMutation,
      variables: { input: { id } },
    });
  }

  return (
    <View className="App">
      <Heading level={1}>My Task Management App</Heading>
      <Flex justifyContent="flex-end" margin="0 18rem">
      <Button variation="primary" onClick={signOut}> 👋 Sign Out</Button>
      </Flex>
      
      <View as="form" margin="3rem 18rem" onSubmit={createTask}>
        <Flex direction="column" justifyContent="flex-start">
          <TextField
            name="name"            
            label="Task Name: "            
            variation="quiet"
            required
          />
          <TextField
            name="description"            
            label="Task Description: "           
            variation="default"
            isMultiline={true}
            rows={4}
            required
          />
          <View name="image" as="input" type="file" style={{ alignSelf:"end" }} margin="0 30rem" />
          <Button type="submit" variation="primary" margin="0 24rem">
          🚀 Create Task
          </Button>
        </Flex>

      </View>
      <Heading level={2}>Current Tasks: </Heading>
      <View margin="3rem 8rem">
        {tasks.map((task) => (
          <Flex
            key={task.id || task.name}
            direction="row"
            justifyContent="flex-start"
            alignItems="flex-start"
          >
            <Text as="strong" fontWeight={700}>
              {task.name}
            </Text>
            <Text as="span">{task.description}</Text>
            {task.image && ( <Image src={task.image} alt={`image for ${task.name}`} style={{width:400}} /> )}
            <Button variation="link" onClick={() => deleteTask(task)}> 
              Delete task
            </Button>
          </Flex>
        ))}
      </View>
      
    </View>
  );
};

export default withAuthenticator(App);