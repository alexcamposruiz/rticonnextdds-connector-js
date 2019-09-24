/******************************************************************************
* (c) 2005-2019 Copyright, Real-Time Innovations.  All rights reserved.       *
* No duplications, whole or partial, manual or electronic, may be made        *
* without express written permission.  Any such copies, or revisions thereof, *
* must display this notice unaltered.                                         *
* This code contains trade secrets of Real-Time Innovations, Inc.             *
******************************************************************************/

var path = require('path')
var expect = require('chai').expect
var rti = require(path.join(__dirname, '/../../rticonnextdds-connector'))
var sleep = require('sleep')

// We have to do this due to the expect() syntax of chai and the fact
// that we install mocha globally
/* eslint-disable no-unused-expressions */
/* eslint-disable no-undef */

// Test Parameterization- describe block will execute once for each param
const params = ['read', 'take']

params.forEach((retrievalMethod) => {
  describe('DataflowTests for ' + retrievalMethod, function () {
    var input, output, testMsg

    // Initialization before all tests execute
    before(function () {
      testMsg = { x: 1, y: 1, z: true, color: 'BLUE', shapesize: 5 }
      const participantProfile = 'MyParticipantLibrary::Zero'
      const xmlProfile = path.join(__dirname, '/../xml/TestConnector.xml')
      connector = new rti.Connector(participantProfile, xmlProfile)
      input = connector.getInput('MySubscriber::MySquareReader')
      output = connector.getOutput('MyPublisher::MySquareWriter')
    })

    // Clean-up after all tests execute
    after(function () {
      this.timeout(0)
      connector.delete()
    })

    // Initialization done before each test executes
    beforeEach(function () {
      // take pre-existing samples from middleware chache
      input.take()
      output.instance.setFromJSON(testMsg)
      output.write()
      // loop to allow sometime for discovery of Input and Output objects
      for (var i = 0; i < 20; i++) {
        sleep.usleep(500)
        input[retrievalMethod]()
        if (input.samples.getLength() > 0) {
          break
        }
      }
    })

    it('samples length should be 1', function () {
      const len = input.samples.getLength()
      expect(len).to.equal(1)
    })

    it('infos length should be 1', function () {
      const len = input.infos.getLength()
      expect(len).to.equal(1)
    })

    it('data received should be valid', function () {
      const validity = input.infos.isValid(0)
      expect(validity).to.equal(1)
    })

    it('received JSON representation of data should be the same as ' +
      'the JSON object sent', function () {
      const receivedJson = input.samples.getJSON(0)
      expect(receivedJson).to.deep.equal(JSON.parse(JSON.stringify(testMsg)))
    })

    it('received fields of data should be the same as ' +
      'that of the JSON object sent', function () {
      var x = input.samples.getNumber(0, 'x')
      var y = input.samples.getNumber(0, 'y')
      var z = input.samples.getBoolean(0, 'z')
      var color = input.samples.getString(0, 'color')
      var shapesize = input.samples.getNumber(0, 'shapesize')

      expect(x).to.equal(testMsg.x)
      expect(y).to.equal(testMsg.y)
      // NOTE: getBoolean returns an Integer representation of Boolean (legacy reasons)
      expect(z).to.equal(+testMsg.z)
      expect(shapesize).to.equal(testMsg.shapesize)
      expect(color).to.equal(testMsg.color)
    })

    // Unimplemented tests
    it('Behavior of getBoolean on String or Number fields should be considered')
    it('Behavior of getString on Number or Boolean fields should be considered')
    it('Behavior of getNumber on String or Boolean fields should be considered')
  })
})
