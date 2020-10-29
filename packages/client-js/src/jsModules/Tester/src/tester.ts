
interface ExternalDataStore {
    [key: string]: string
}

const dataStore: ExternalDataStore = {};

// // Functional equivalent
// // Assume that this is called once, and an instance is kept alive until the original caller finishes
export const TesterJSModule = () => {
    const setValue = (args: {key: string, value: string}): boolean => {
        const {key, value} = args;
        const newValue = dataStore[key] === undefined;
        dataStore[key] = value;
        return newValue;
    }

    const getValue = (args: {key: string}): Maybe<string> => {
        const {key} = args;
        return dataStore[key];
    }

    return {
        Mutate: {
            setValue
        },
        Query: {
            getValue
        }
    }
}

// // Alternatively we can hold Query/Mutations in separate objects:
// TesterJSModule.Query.getValue
// TesterJSModule.Mutation.setValue

/* 
This is addressing WASM -> JS:

    Since we can convert a message pack into a JS object we can introspect that object with
        Object.values and Object.keys

    Then we make sure that the Object is in the schema we want (Object Schema validation)

    We extract the URI and Query
        Use the URI to resolve to the JS Module
        Use the Query to figure out what function we're calling

    Then we inspect the arguments message pack that we've converted back to a JS Object
        From the query we know what function we're calling, and what arguments are given
        Extract those arguments from the JS Object

    Now we have a JS Web3API, a function name, and key-value map of arguments
        Inspect the JS Web3API to see if a function exists with that name
            Alternatively we just bind like we do with wasm web3apis
        
        Attempt to call that function with the arguments ordered based on their order in the graph QL schema
            This requires the GraphQL schema arguments to be in the same order as the JS arguments
                This might suck, so we have two alternatives:
                    1. Parse the function to figure out the order of the arguments on runtime: https://stackoverflow.com/questions/1007981/how-to-get-function-parameter-names-values-dynamically?page=1&tab=votes#tab-top
                    2. Use an object for arguments
                        - JS Web3API developers have to use a single object as input parameters

        
    In the JS->JS case there's no message pack neccessarily
        We just have a GraphQL query, which I think paints a clearer picture
            we shouldn't have 2 flows


    |    User    |    Client    |    WASM Module    |
                            <------>
                    Convert to/from msgpack here

      [--------------------]
            |
            |
      Data is always in JS Objects here


      
    |    User    |    Client    |    JS Module    |
                            <------>
                        No need to use msgpack here
    
*/