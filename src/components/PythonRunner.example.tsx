import PythonRunner from './PythonRunner';

function PythonRunnerExample() {
  return (
    <PythonRunner
      starterCode={`name = "Codev learner"
print(f"Hello, {name}!")

for number in range(1, 4):
    print(number * number)`}
      readOnly={false}
    />
  );
}

export default PythonRunnerExample;
