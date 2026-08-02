---
publish: true
created: 2023-12-13T00:56:28.090+03:00
modified: 2023-12-17T00:43:33.464+03:00
---

# How I Got Started with Blockchain

## 2017 Bitcoin Craze

In 2017, I was a university student at Strathmore University and my friends and I would always talk about the latest technologies we found on the internet. Sometimes, we would even picture how we could turn them into startups. There were times when we would even build out various pieces of software so that we can prove our prowess in the space.

This was around the time when Bitcoin rose dramatically to \$20,000. Before that happened, my friend Wole told me how we bought some a while back and he was excited about the profit he was going to make. In fear of missing out, I looked for various websites that I could use to buy the cryptocurrency. I settled on LocalBitcoins.com, which is a peer-to-peer crypto exchange that connects holders of crypto to buyers. They would lock the crypto in an escrow account and ask the buyer to send money to the seller. Once the seller confirms the payment has been made, he signals to the exchange and the crypto is released to the buyer. It sounded like a very cumbersome process but Kenya had no operational crypto exchanges at the time. I say this because there was company called Bitpesa that attempted to be a central crypto exchange and they were blocked by Safaricom and later, the Central Bank of Kenya.

I bought Bitcoin as around $7000, which later climbed to $20000. I was happy about this but I wished that I have invested more. I only put a mere Kshs. 2000 or $20. However, these gains were short-lived and the market crash by the end of 2017. At the time, it has dropped to $6000 and I quickly counted it as a loss and moved on.

## The Promise of the Blockchain

However, my friends and I never quite moved on as we had discovered the underlying technology known as blockchain. We would discuss it potential and how it could revolutionise how we store value and make money obsolete. We thought about how we would dethrone Mpesa and become the new financial juggernaut in Africa.

The idea of the blockchain has inspiring as it allows important and valuable transactions to take place without the need for a central authority. These authorities include banks that store people's life savings and keep track of debts, Ministry of Lands which tracks the ownership of land and others. In developed countries, they tend to have trustworthy agencies that provide quality service for the customer and citizens. This is in stark contrast to many African countries, run by corrupt politicians and predatory businessmean.

By working on the blockchain, we thought of ourselves as heroes on a mission to eradicate the evils of centralisation. In short, we were students with big dreams and we realised that we had to start somewhere.

## Electioneering on the blockchain

Since we were university students, we looked around for the easiest problem we could solve in the university. It was around August and the Student Council elections were coming up. One of my colleagues suggested that we build a voting application on the blockchain for the upcoming election in September. Without further ado, we got started on mapping out how we would do this.

It started with pen and paper as we sketched the user flow of the system. Knowing what I know now, we should have started by understanding the problem, however, we are excused. We drew the diagram and saw that we would encouter a major issue, registration of voters. Before every election, from national to casual meetings, it is important to know how many people are voting and identify those people. This process makes sure that no one votes more than once in an election, otherwise, it would not be fair. The solution for this was simple, conduct voter registration for students who will be voting. However, this is a process that is managed by the school administrator and it would not be wise to conduct an alternate voting process, especially with the university that shall not be named.

We realised that we had to start with the conversation with school. Luckily, one of us knew the Vice President of the Student Council and getting a meeting would have been simple. What we needed was the product and we needed it fast. We were three Computer Science students and one Business student so we were confident that we could handle the development.

We hurriedly gathered resources that we could use to get started on building this. We found videos from DappUniversity, got a book by Siraj Raval on Decentralised Applications and even Udemy courses on Ethereum Development. In 2nd year Computer Science fashion, we found an end-to-end tutorial that took us through on how to build a voting system on the Ethereum blockchain. We dropped all the other resources we were looking at and focused on following the steps.

### System specifications

The system was implemented using JavaScript, which we had covered previously in our Web Development Unit. Although, we had the basics, it was enough to understand the code and debug any errors that we came across. Blockchain applications have the following modules that make up their structure:

1. User interface or Frontend
2. Wallet - for the developer and user to interact with the blockchain
3. Application layer - that connects to the database
4. Blockchain - the decentralised data storage for the application

The only difference between traditional server application and blockchain applications is the decentralised data storage of the system. You can have your data stored and managed by a large number of computers and secure your data. The benefits of this are:

1. No central point of failure
   - In a traditional server setup, it is no surprise to find that the server goes down accidentally or intentionally. In this scenario, the application is inaccessible leading to a halt in providing services. This is not good for business.
   - With the blockchain, you can access and use the application by accessing one of the many computers that run the blockchain software. If one of the computers goes down, there is always another one that will pick up the slack. The service will continue, regardless of the failure of one computer.

2. Immutable
   - This concept means that the data cannot easily be changed illegally or accidentally by bad actors or failures. This feature makes sure that the integrity of your data is always sound and unaltered.
   - In a server setup, any of the administrators has the power to change the stored data at any time. This is prone to mismanagement and corruption as ill-intentioned administrators can change relevant information if it doesn't suit their needs.

3. Public
   - There is no gatekeeper for who can access and use a blockchain. As long as you have a computer, internet connection and the blockchain software, you can interact with the blockchain like everyone else.
   - This is different from servers, which require username and password access or special tokens to access their services through an API. In this system, the administrators can easily remove a user or block token access to a service. This leaves you in a vulnerable position.

## The Pitch

Once we had built the voting application, our Business friend set up the meeting with the Vice President of the Student Council. We got to the office quite
