module.exports = async({ context, github, core }) => {
            console.log('commit hash value:');
            console.log(github.sha);
            const result = await github.rest.actions.createWorkflowDispatch({
              owner: `${ process.env.OWNER }`,
              repo: `${ process.env.REPO }`,
              workflow_id: `${ process.env.WORKFLOW_ID }`,
              inputs: {
                      commit_hash: github.sha
                      },
              ref: 'main'
            })
            
            lastRun = '';
            if (result.status === 204) {
                await new Promise(resolve => setTimeout(resolve, 10000));
                const runs = await github.paginate(github.rest.actions.listWorkflowRuns.endpoint.merge({
                owner: `${ process.env.OWNER }`,
                repo: `${ process.env.REPO }`,
                workflow_id: `${ process.env.WORKFLOW_ID }`,
              })); 
                lastRun = runs[0].id;
                console.log(`API test workflow run id: ${lastRun}`);
//                 console.log(lastRun);
            } else {
                console.log('API test workflow is not dispatched successfully');
            }
            run_status = await github.rest.actions.getWorkflowRun({
              owner: `${ process.env.OWNER }`,
              repo: `${ process.env.REPO }`,
              workflow_id: `${ process.env.WORKFLOW_ID }`,
              run_id: lastRun
            }) 
            
            console.log(`Current API test status: ${run_status.data.status}`);
            
            while (run_status.data.status !== 'completed') {
              console.log(`Current API test status: ${run_status.data.status}`);
              
              await new Promise(resolve => setTimeout(resolve, 5000));
              run_status = await github.rest.actions.getWorkflowRun({
                owner: `${ process.env.OWNER }`,
                repo: `${ process.env.REPO }`,
                workflow_id: `${ process.env.WORKFLOW_ID }`,
                run_id: lastRun
              });
            }
            console.log(`Workflow completed with status: ${run_status.data.conclusion}`);
            
            if (run_status.data.conclusion === 'success') {
                core.setOutput('status', 'success');
              } else {
                console.log('Upstream workflow failed');
                core.setFailed('failed');
              }
};
