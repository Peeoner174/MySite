App = {
    web3Provider: null,
    contracts: {},
    account: '0x0',
    hasVoted: false,
  
    init: function() {
      return App.initWeb3();
    },
  
    initWeb3: function() {
      // TODO: refactor conditional
      if (typeof web3 !== 'undefined') {
        // If a web3 instance is already provided by Meta Mask.
        App.web3Provider = web3.currentProvider;
        web3 = new Web3(web3.currentProvider);
      } else {
        // Specify default instance if no web3 instance provided
        App.web3Provider = new Web3.providers.WebsocketProvider('ws://localhost:8545');
        web3 = new Web3(App.web3Provider);
      }
      return App.initContract();
    },
  
    initContract: function() {
      $.getJSON("VoteFactory.json", function(voteFactory) {
        // Instantiate a new truffle contract from the artifact
        App.contracts.VoteFactory = TruffleContract(voteFactory);
        // Connect provider to interact with contract
        App.contracts.VoteFactory.setProvider(App.web3Provider);
  
        App.listenForEvents();
  
        return App.render();
      });
    },
  
    // Listen for events emitted from the contract
    listenForEvents: function() {
      App.contracts.Election.deployed().then(function(instance) {
        // Restart Chrome if you are unable to receive this event
        // This is a known issue with Metamask
        // https://github.com/MetaMask/metamask-extension/issues/2393
        instance.VotedEvent({}, {
          fromBlock: 0,
          toBlock: 'latest'
        }).watch(function(error, event) {
          console.log("event triggered", event)
          // Reload when a new vote is recorded
          App.render();
        });
      });
    },
  
    render: function() {
      var voteFactoryInstance;
      var loader = $("#loader");
      var content = $("#content");
  
      loader.show();
      content.hide();
  
      // Load account data
      web3.eth.getCoinbase(function(err, account) {
        if (err === null) {
          App.account = account;
          $("#accountAddress").html("Your Account: " + account);
        }
      });
  
      // Load contract data
      App.contracts.VoteFactory.deployed().then(function(instance) {
        voteFactoryInstance = instance;
        var answersCount = voteFactoryInstance.getAnswersCount(0); 
        return answersCount;
      }).then(function(answersCount) {
        var votesResults = $("#votesResults");
        votesResults.empty();
  
        var votesSelect = $('#votesSelect');
        votesSelect.empty();
        
        var vote = voteFactoryInstance.votes[0]; 
        for (var i = 1; i <= answersCount; i++) {
          vote.answers[i].then(function(vote) {
            var answers = vote[2].answers[i];
            var voteCount = vote.voteCount[i]
            // Render candidate Result
            var answerTemplate = "<tr><th>" + i + "</th><td>" + answers + "</td><td>" + voteCount + "</td></tr>"
            votesResults.append(answerTemplate);
  
            // Render candidate ballot option
            var answerOption = "<option value='" + i + "' >" + answers + "</ option>"
            voteSelect.append(answerOption);
          });
        }
        return voteFactoryInstance.voters(App.account);
      }).then(function(hasVoted) {
        // Do not allow a user to vote
        if(hasVoted) {
          $('form').hide();
        }
        loader.hide();
        content.show();
      }).catch(function(error) {
        console.warn(error);
      });
    },
    App = {
        web3Provider: null,
        contracts: {},
        account: '0x0',
        hasVoted: false,
      
        init: function() {
          return App.initWeb3();
        },
      
        initWeb3: function() {
          // TODO: refactor conditional
          if (typeof web3 !== 'undefined') {
            // If a web3 instance is already provided by Meta Mask.
            App.web3Provider = web3.currentProvider;
            web3 = new Web3(web3.currentProvider);
          } else {
            // Specify default instance if no web3 instance provided
            App.web3Provider = new Web3.providers.WebsocketProvider('ws://localhost:8545');
            web3 = new Web3(App.web3Provider);
          }
          return App.initContract();
        },
      
        initContract: function() {
          $.getJSON("Election.json", function(election) {
            // Instantiate a new truffle contract from the artifact
            App.contracts.Election = TruffleContract(election);
            // Connect provider to interact with contract
            App.contracts.Election.setProvider(App.web3Provider);
      
            App.listenForEvents();
      
            return App.render();
          });
        },
      
        // Listen for events emitted from the contract
        listenForEvents: function() {
          App.contracts.Election.deployed().then(function(instance) {
            // Restart Chrome if you are unable to receive this event
            // This is a known issue with Metamask
            // https://github.com/MetaMask/metamask-extension/issues/2393
            instance.votedEvent({}, {
              fromBlock: 0,
              toBlock: 'latest'
            }).watch(function(error, event) {
              console.log("event triggered", event)
              // Reload when a new vote is recorded
              App.render();
            });
          });
        },
      
        render: function() {
          var voteFactory
Instance;
          var loader = $("#loader");
          var content = $("#content");
      
          loader.show();
          content.hide();
      
          // Load account data
          web3.eth.getCoinbase(function(err, account) {
            if (err === null) {
              App.account = account;
              $("#accountAddress").html("Your Account: " + account);
            }
          });
      
          // Load contract data
          App.contracts.Election.deployed().then(function(instance) {
            voteFactory
Instance = instance;
            return voteFactory
Instance.candidatesCount();
          }).then(function(candidatesCount) {
            var candidatesResults = $("#candidatesResults");
            candidatesResults.empty();
      
            var candidatesSelect = $('#candidatesSelect');
            candidatesSelect.empty();
      
            for (var i = 1; i <= candidatesCount; i++) {
              voteFactory
    Instance.candidates(i).then(function(candidate) {
                var id = candidate[0];
                var name = candidate[1];
                var voteCount = candidate[2];
      
                // Render candidate Result
                var candidateTemplate = "<tr><th>" + id + "</th><td>" + name + "</td><td>" + voteCount + "</td></tr>"
                candidatesResults.append(candidateTemplate);
      
                // Render candidate ballot option
                var answerOption = "<option value='" + id + "' >" + name + "</ option>"
                candidatesSelect.append(answerOption);
              });
            }
            return voteFactory
Instance.voters(App.account);
          }).then(function(hasVoted) {
            // Do not allow a user to vote
            if(hasVoted) {
              $('form').hide();
            }
            loader.hide();
            content.show();
          }).catch(function(error) {
            console.warn(error);
          });
        },
      
        castVote: function() {
          var candidateId = $('#candidatesSelect').val();
          App.contracts.Election.deployed().then(function(instance) {
            return instance.vote(candidateId, { from: App.account });
          }).then(function(result) {
            // Wait for votes to update
            $("#content").hide();
            $("#loader").show();
          }).catch(function(err) {
            console.error(err);
          });
        }
      };
      
      $(function() {
        $(window).load(function() {
          App.init();
        });
      });
      
    castVote: function() {
      var candidateId = $('#candidatesSelect').val();
      App.contracts.Election.deployed().then(function(instance) {
        return instance.vote(candidateId, { from: App.account });
      }).then(function(result) {
        // Wait for votes to update
        $("#content").hide();
        $("#loader").show();
      }).catch(function(err) {
        console.error(err);
      });
    }
  };
  
  $(function() {
    $(window).load(function() {
      App.init();
    });
  });
  